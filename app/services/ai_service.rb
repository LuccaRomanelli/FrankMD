# frozen_string_literal: true

require "ruby_llm"

class AiService
  GRAMMAR_PROMPT = <<~PROMPT
    You are a grammar and spelling corrector. Fix ONLY:
    - Grammar errors
    - Spelling mistakes
    - Typos
    - Punctuation errors

    DO NOT change:
    - Facts, opinions, or meaning
    - Writing style or tone
    - Markdown formatting (headers, links, code blocks, lists, etc.)
    - Technical terms or proper nouns
    - Code blocks or inline code

    Return ONLY the corrected text with no explanations or commentary.
  PROMPT

  class << self
    def enabled?
      config_instance.feature_available?("ai")
    end

    def available_providers
      config_instance.ai_providers_available
    end

    def current_provider
      config_instance.effective_ai_provider
    end

    def current_model
      config_instance.effective_ai_model
    end

    def fix_grammar(text)
      return { error: "AI not configured" } unless enabled?
      return { error: "No text provided" } if text.blank?

      provider = current_provider
      model = current_model

      return { error: "No AI provider available" } unless provider && model

      # Debug: log what we're about to use
      cfg = config_instance
      key_for_provider = case provider
      when "openai" then cfg.get_ai("openai_api_key")
      when "openrouter" then cfg.get_ai("openrouter_api_key")
      when "anthropic" then cfg.get_ai("anthropic_api_key")
      when "gemini" then cfg.get_ai("gemini_api_key")
      else nil
      end
      key_prefix = key_for_provider&.slice(0, 10) || "none"
      Rails.logger.info "AI request: provider=#{provider}, model=#{model}, key_prefix=#{key_prefix}..., ai_in_file=#{cfg.ai_configured_in_file?}"

      configure_client
      chat = RubyLLM.chat(model: model)
      chat.with_instructions(GRAMMAR_PROMPT)
      response = chat.ask(text)

      { corrected: response.content, provider: provider, model: model }
    rescue StandardError => e
      Rails.logger.error "AI error (#{provider}/#{model}): #{e.class} - #{e.message}"
      { error: "AI processing failed: #{e.message}" }
    end

    # Get provider info for frontend display
    def provider_info
      {
        enabled: enabled?,
        provider: current_provider,
        model: current_model,
        available_providers: available_providers
      }
    end

    private

    def configure_client
      cfg = config_instance
      provider = current_provider

      RubyLLM.configure do |config|
        # Clear ALL provider keys first to avoid cross-contamination
        # RubyLLM.configure is additive, so previous keys may persist
        config.openai_api_key = nil
        config.openrouter_api_key = nil
        config.anthropic_api_key = nil
        config.gemini_api_key = nil
        config.ollama_api_base = nil

        # Now set ONLY the specific provider we're using
        # Use get_ai to respect .webnotes override of ENV vars
        case provider
        when "ollama"
          config.ollama_api_base = cfg.get_ai("ollama_api_base")
        when "openrouter"
          config.openrouter_api_key = cfg.get_ai("openrouter_api_key")
        when "anthropic"
          config.anthropic_api_key = cfg.get_ai("anthropic_api_key")
        when "gemini"
          config.gemini_api_key = cfg.get_ai("gemini_api_key")
        when "openai"
          config.openai_api_key = cfg.get_ai("openai_api_key")
        end
      end
    end

    def config_instance
      # Don't cache - config may change
      Config.new
    end
  end
end
