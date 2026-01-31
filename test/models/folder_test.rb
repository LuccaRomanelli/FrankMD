# frozen_string_literal: true

require "test_helper"

class FolderTest < ActiveSupport::TestCase
  def setup
    setup_test_notes_dir
  end

  def teardown
    teardown_test_notes_dir
  end

  # === Folder.find ===

  test "Folder.find returns folder" do
    create_test_folder("my_folder")
    folder = Folder.find("my_folder")

    assert_equal "my_folder", folder.path
    assert_equal "my_folder", folder.name
  end

  test "Folder.find raises for missing folder" do
    assert_raises(NotesService::NotFoundError) do
      Folder.find("nonexistent")
    end
  end

  test "Folder.find works with nested paths" do
    create_test_folder("deep/nested/folder")
    folder = Folder.find("deep/nested/folder")

    assert_equal "deep/nested/folder", folder.path
    assert_equal "folder", folder.name
    assert_equal "deep/nested", folder.parent_path
  end

  # === folder.create ===

  test "folder.create makes directory" do
    folder = Folder.new(path: "new_folder")
    assert folder.create
    assert File.directory?(@test_notes_dir.join("new_folder"))
  end

  test "folder.create makes nested directories" do
    folder = Folder.new(path: "deep/nested/new_folder")
    assert folder.create
    assert File.directory?(@test_notes_dir.join("deep/nested/new_folder"))
  end

  test "folder.create returns false if folder exists" do
    create_test_folder("existing_folder")
    folder = Folder.new(path: "existing_folder")

    refute folder.create
    assert folder.errors[:base].any?
  end

  test "folder.create validates path format" do
    folder = Folder.new(path: "../escape")
    refute folder.valid?
    assert folder.errors[:path].any?
  end

  test "folder.create validates presence of path" do
    folder = Folder.new(path: "")
    refute folder.valid?
    assert folder.errors[:path].any?
  end

  # === folder.destroy ===

  test "folder.destroy removes empty directory" do
    create_test_folder("empty_folder")
    folder = Folder.new(path: "empty_folder")

    assert folder.destroy
    refute File.exist?(@test_notes_dir.join("empty_folder"))
  end

  test "folder.destroy fails for non-empty directory" do
    create_test_folder("folder_with_content")
    create_test_note("folder_with_content/note.md")
    folder = Folder.new(path: "folder_with_content")

    refute folder.destroy
    assert folder.errors[:base].any?
    assert File.exist?(@test_notes_dir.join("folder_with_content"))
  end

  test "folder.destroy returns false for missing folder" do
    folder = Folder.new(path: "nonexistent")
    refute folder.destroy
    assert folder.errors[:base].any?
  end

  # === folder.rename ===

  test "folder.rename moves folder" do
    create_test_folder("old_folder")
    folder = Folder.new(path: "old_folder")

    assert folder.rename("new_folder")
    assert_equal "new_folder", folder.path
    refute File.exist?(@test_notes_dir.join("old_folder"))
    assert File.exist?(@test_notes_dir.join("new_folder"))
  end

  test "folder.rename moves folder with contents" do
    create_test_folder("old_folder")
    create_test_note("old_folder/note.md", "content")
    folder = Folder.new(path: "old_folder")

    assert folder.rename("new_folder")
    refute File.exist?(@test_notes_dir.join("old_folder"))
    assert File.exist?(@test_notes_dir.join("new_folder"))
    assert File.exist?(@test_notes_dir.join("new_folder/note.md"))
  end

  # === folder.exists? ===

  test "folder.exists? returns true for existing directory" do
    create_test_folder("exists")
    folder = Folder.new(path: "exists")
    assert folder.exists?
  end

  test "folder.exists? returns false for missing directory" do
    folder = Folder.new(path: "missing")
    refute folder.exists?
  end

  test "folder.exists? returns false for files" do
    create_test_note("file.md")
    folder = Folder.new(path: "file.md")
    refute folder.exists?
  end

  # === folder attributes ===

  test "folder.name returns folder name" do
    folder = Folder.new(path: "my_folder")
    assert_equal "my_folder", folder.name
  end

  test "folder.name returns last component of nested path" do
    folder = Folder.new(path: "deep/nested/folder")
    assert_equal "folder", folder.name
  end

  test "folder.parent_path returns parent directory" do
    folder = Folder.new(path: "parent/child")
    assert_equal "parent", folder.parent_path
  end

  test "folder.parent_path returns nil for root folders" do
    folder = Folder.new(path: "root_folder")
    assert_nil folder.parent_path
  end

  test "folder.persisted? returns true when directory exists" do
    create_test_folder("persisted")
    folder = Folder.new(path: "persisted")
    assert folder.persisted?
  end

  test "folder.persisted? returns false when directory does not exist" do
    folder = Folder.new(path: "not_persisted")
    refute folder.persisted?
  end

  test "folder.to_param returns path" do
    folder = Folder.new(path: "my/path")
    assert_equal "my/path", folder.to_param
  end

  # === folder.children ===

  test "folder.children returns children items" do
    create_test_folder("parent")
    create_test_note("parent/child1.md")
    create_test_note("parent/child2.md")
    create_test_folder("parent/subfolder")

    folder = Folder.new(path: "parent")
    children = folder.children

    assert_kind_of Array, children
    assert_equal 3, children.length
  end

  test "folder.children returns empty array for empty folder" do
    create_test_folder("empty")
    folder = Folder.new(path: "empty")

    assert_equal [], folder.children
  end

  test "folder.children returns empty array for nonexistent folder" do
    folder = Folder.new(path: "nonexistent")
    assert_equal [], folder.children
  end

  # === Permission and file system errors ===

  test "folder.destroy handles folder that disappeared" do
    create_test_folder("disappearing")
    folder = Folder.new(path: "disappearing")

    # Delete the folder externally
    FileUtils.rm_rf(@test_notes_dir.join("disappearing"))

    refute folder.destroy
    assert folder.errors[:base].any?
    assert_includes folder.errors[:base].first, "not found"
  end

  test "folder.rename handles source folder that disappeared" do
    create_test_folder("source_folder")
    folder = Folder.new(path: "source_folder")

    # Delete the folder externally
    FileUtils.rm_rf(@test_notes_dir.join("source_folder"))

    refute folder.rename("destination_folder")
    assert folder.errors[:base].any?
  end

  test "folder.create handles permission denied" do
    skip "chmod test not applicable on this platform" unless File.respond_to?(:chmod)

    # Make the base directory read-only
    File.chmod(0o555, @test_notes_dir)

    folder = Folder.new(path: "cannot_create")
    result = folder.create

    # Restore permissions for cleanup
    File.chmod(0o755, @test_notes_dir)

    refute result
    assert folder.errors[:base].any?
    assert_includes folder.errors[:base].first, "Permission denied"
  end

  test "folder.destroy handles permission denied" do
    skip "chmod test not applicable on this platform" unless File.respond_to?(:chmod)

    create_test_folder("protected_folder")
    File.chmod(0o555, @test_notes_dir)

    folder = Folder.new(path: "protected_folder")
    result = folder.destroy

    # Restore permissions for cleanup
    File.chmod(0o755, @test_notes_dir)

    refute result
    assert folder.errors[:base].any?
    assert_includes folder.errors[:base].first, "Permission denied"
  end
end
