# frozen_string_literal: true

class Folder
  include ActiveModel::Model
  include ActiveModel::Attributes
  include ActiveModel::Validations

  attribute :path, :string

  validates :path, presence: true
  validate :path_within_base_directory

  class << self
    def find(path)
      folder = new(path: path)
      raise NotesService::NotFoundError, "Folder not found: #{path}" unless folder.exists?
      folder
    end

    def service
      NotesService.new
    end
  end

  def name
    File.basename(path.to_s)
  end

  def parent_path
    dir = File.dirname(path.to_s)
    dir == "." ? nil : dir
  end

  def exists?
    return false if path.blank?
    service.directory?(path)
  end

  def children
    tree = service.list_tree
    find_in_tree(tree, path)&.dig(:children) || []
  end

  def create
    return false unless valid?
    if exists?
      errors.add(:base, I18n.t("errors.folder_already_exists"))
      return false
    end
    service.create_folder(path)
    true
  rescue NotesService::InvalidPathError => e
    errors.add(:path, e.message)
    false
  rescue Errno::EACCES, Errno::EPERM
    errors.add(:base, I18n.t("errors.permission_denied"))
    false
  rescue Errno::ENOENT
    errors.add(:base, I18n.t("errors.parent_folder_not_found"))
    false
  end

  def destroy
    service.delete_folder(path)
    true
  rescue NotesService::NotFoundError
    errors.add(:base, I18n.t("errors.folder_not_found"))
    false
  rescue NotesService::InvalidPathError => e
    errors.add(:base, e.message)
    false
  rescue Errno::EACCES, Errno::EPERM
    errors.add(:base, I18n.t("errors.permission_denied"))
    false
  rescue Errno::ENOENT
    errors.add(:base, I18n.t("errors.folder_no_longer_exists"))
    false
  end

  def rename(new_path)
    service.rename(path, new_path)
    self.path = new_path

    # Update Hugo frontmatter slug if index.md exists
    update_hugo_index_slug(new_path)

    true
  rescue NotesService::NotFoundError
    errors.add(:base, I18n.t("errors.folder_not_found"))
    false
  rescue NotesService::InvalidPathError => e
    errors.add(:path, e.message)
    false
  rescue Errno::EACCES, Errno::EPERM
    errors.add(:base, I18n.t("errors.permission_denied"))
    false
  rescue Errno::ENOENT
    errors.add(:base, I18n.t("errors.folder_no_longer_exists"))
    false
  end

  def persisted?
    exists?
  end

  def to_param
    path
  end

  private

  def service
    @service ||= NotesService.new
  end

  # Update slug in index.md frontmatter after folder rename
  def update_hugo_index_slug(folder_path)
    index_path = "#{folder_path}/index.md"
    return unless service.file?(index_path)

    content = service.read(index_path)
    return unless content.start_with?("---")

    # Parse frontmatter
    parts = content.split(/^---\s*$/, 3)
    return unless parts.length >= 3

    frontmatter = parts[1]
    body = parts[2]

    # Check if this is a Hugo post (has slug field)
    return unless frontmatter.include?("slug:")

    # Generate new slug from folder name
    new_folder_name = File.basename(folder_path)
    new_slug = slugify(new_folder_name)

    # Update the slug in frontmatter
    updated_frontmatter = frontmatter.gsub(/^slug:\s*"[^"]*"/, "slug: \"#{new_slug}\"")
                                     .gsub(/^slug:\s*'[^']*'/, "slug: \"#{new_slug}\"")
                                     .gsub(/^slug:\s*[^\s\n]+/, "slug: \"#{new_slug}\"")

    # Only write if something changed
    return if updated_frontmatter == frontmatter

    updated_content = "---#{updated_frontmatter}---#{body}"
    service.write(index_path, updated_content)
  rescue StandardError => e
    # Log but don't fail the rename if slug update fails
    Rails.logger.warn("Failed to update Hugo slug in #{index_path}: #{e.message}")
  end

  # Generate URL-safe slug from text
  def slugify(text)
    # Map of accented characters to ASCII equivalents
    accent_map = {
      "à" => "a", "á" => "a", "â" => "a", "ã" => "a", "ä" => "a", "å" => "a", "æ" => "ae",
      "ç" => "c", "č" => "c", "ć" => "c",
      "è" => "e", "é" => "e", "ê" => "e", "ë" => "e", "ě" => "e",
      "ì" => "i", "í" => "i", "î" => "i", "ï" => "i",
      "ð" => "d", "ď" => "d",
      "ñ" => "n", "ň" => "n",
      "ò" => "o", "ó" => "o", "ô" => "o", "õ" => "o", "ö" => "o", "ø" => "o",
      "ù" => "u", "ú" => "u", "û" => "u", "ü" => "u", "ů" => "u",
      "ý" => "y", "ÿ" => "y",
      "ž" => "z", "ź" => "z", "ż" => "z",
      "ß" => "ss", "þ" => "th",
      "š" => "s", "ś" => "s",
      "ř" => "r",
      "ł" => "l"
    }

    text.downcase
        .chars
        .map { |c| accent_map[c] || accent_map[c.downcase] || c }
        .join
        .gsub(/[^a-z0-9]+/, "-")  # Replace non-alphanumeric with hyphens
        .gsub(/^-+|-+$/, "")       # Remove leading/trailing hyphens
        .gsub(/-+/, "-")           # Collapse multiple hyphens
  end

  def find_in_tree(items, target_path)
    return nil unless items.is_a?(Array)

    items.each do |item|
      return item if item[:path] == target_path
      if item[:type] == "folder" && item[:children]
        found = find_in_tree(item[:children], target_path)
        return found if found
      end
    end
    nil
  end

  def path_within_base_directory
    return if path.blank?
    if path.to_s.include?("..")
      errors.add(:path, "cannot contain directory traversal")
    end
  end
end
