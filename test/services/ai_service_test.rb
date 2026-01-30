# frozen_string_literal: true

require "test_helper"

class AiServiceTest < ActiveSupport::TestCase
  def setup
    setup_test_notes_dir
    # Save and clear all AI-related env vars
    @original_env = {}
    %w[
      OPENAI_API_KEY OPENROUTER_API_KEY ANTHROPIC_API_KEY
      GEMINI_API_KEY OLLAMA_API_BASE AI_PROVIDER AI_MODEL
      OPENAI_MODEL OPENROUTER_MODEL ANTHROPIC_MODEL GEMINI_MODEL OLLAMA_MODEL
    ].each do |key|
      @original_env[key] = ENV[key]
      ENV.delete(key)
    end
  end

  def teardown
    teardown_test_notes_dir
    # Restore original env vars
    @original_env.each do |key, value|
      if value
        ENV[key] = value
      else
        ENV.delete(key)
      end
    end
  end

  # Provider detection tests
  test "enabled? returns false when no providers configured" do
    assert_not AiService.enabled?
  end

  test "enabled? returns true when OpenAI key is set" do
    ENV["OPENAI_API_KEY"] = "sk-test-key"
    assert AiService.enabled?
  end

  test "enabled? returns true when OpenRouter key is set" do
    ENV["OPENROUTER_API_KEY"] = "sk-or-test-key"
    assert AiService.enabled?
  end

  test "enabled? returns true when Anthropic key is set" do
    ENV["ANTHROPIC_API_KEY"] = "sk-ant-test-key"
    assert AiService.enabled?
  end

  test "enabled? returns true when Gemini key is set" do
    ENV["GEMINI_API_KEY"] = "gemini-test-key"
    assert AiService.enabled?
  end

  test "enabled? returns true when Ollama base is set" do
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"
    assert AiService.enabled?
  end

  # Provider priority tests (auto mode)
  # Priority: openai > anthropic > gemini > openrouter > ollama
  test "current_provider returns openai when multiple providers available" do
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"
    ENV["OPENAI_API_KEY"] = "sk-test"
    ENV["ANTHROPIC_API_KEY"] = "sk-ant-test"

    assert_equal "openai", AiService.current_provider
  end

  test "current_provider returns anthropic when openai not available" do
    ENV["ANTHROPIC_API_KEY"] = "sk-ant-test"
    ENV["GEMINI_API_KEY"] = "gemini-test"

    assert_equal "anthropic", AiService.current_provider
  end

  test "current_provider returns gemini when higher priority not available" do
    ENV["GEMINI_API_KEY"] = "gemini-test"
    ENV["OPENROUTER_API_KEY"] = "sk-or-test"

    assert_equal "gemini", AiService.current_provider
  end

  test "current_provider returns openrouter when higher priority not available" do
    ENV["OPENROUTER_API_KEY"] = "sk-or-test"
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"

    assert_equal "openrouter", AiService.current_provider
  end

  test "current_provider returns ollama when only ollama available" do
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"

    assert_equal "ollama", AiService.current_provider
  end

  # Provider override tests
  test "current_provider respects ai_provider override" do
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"
    ENV["OPENAI_API_KEY"] = "sk-test"
    ENV["AI_PROVIDER"] = "openai"

    assert_equal "openai", AiService.current_provider
  end

  test "current_provider falls back to priority when override not available" do
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"
    ENV["AI_PROVIDER"] = "openai"  # OpenAI not configured

    assert_equal "ollama", AiService.current_provider
  end

  # Model selection tests
  test "current_model returns provider-specific default" do
    ENV["OPENAI_API_KEY"] = "sk-test"
    assert_equal "gpt-4o-mini", AiService.current_model
  end

  test "current_model returns ollama default model" do
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"
    assert_equal "llama3.2:latest", AiService.current_model
  end

  test "current_model returns anthropic default model" do
    ENV["ANTHROPIC_API_KEY"] = "sk-ant-test"
    assert_equal "claude-sonnet-4-20250514", AiService.current_model
  end

  test "current_model returns gemini default model" do
    ENV["GEMINI_API_KEY"] = "gemini-test"
    assert_equal "gemini-2.0-flash", AiService.current_model
  end

  test "current_model returns openrouter default model" do
    ENV["OPENROUTER_API_KEY"] = "sk-or-test"
    assert_equal "openai/gpt-4o-mini", AiService.current_model
  end

  test "current_model respects ai_model global override" do
    ENV["OPENAI_API_KEY"] = "sk-test"
    ENV["AI_MODEL"] = "gpt-4-turbo"

    assert_equal "gpt-4-turbo", AiService.current_model
  end

  test "current_model respects provider-specific model override" do
    ENV["ANTHROPIC_API_KEY"] = "sk-ant-test"
    ENV["ANTHROPIC_MODEL"] = "claude-3-opus-20240229"

    assert_equal "claude-3-opus-20240229", AiService.current_model
  end

  # Error handling tests
  test "fix_grammar returns error when not configured" do
    result = AiService.fix_grammar("Hello world")
    assert_equal "AI not configured", result[:error]
  end

  test "fix_grammar returns error when text is blank" do
    ENV["OPENAI_API_KEY"] = "sk-test-key"
    result = AiService.fix_grammar("")
    assert_equal "No text provided", result[:error]
  end

  test "fix_grammar returns error when text is nil" do
    ENV["OPENAI_API_KEY"] = "sk-test-key"
    result = AiService.fix_grammar(nil)
    assert_equal "No text provided", result[:error]
  end

  # Provider info tests
  test "provider_info returns correct structure" do
    ENV["OPENAI_API_KEY"] = "sk-test"
    ENV["ANTHROPIC_API_KEY"] = "sk-ant-test"

    info = AiService.provider_info

    assert_includes info.keys, :enabled
    assert_includes info.keys, :provider
    assert_includes info.keys, :model
    assert_includes info.keys, :available_providers

    assert info[:enabled]
    assert_equal "openai", info[:provider]  # openai has highest priority
    assert_includes info[:available_providers], "openai"
    assert_includes info[:available_providers], "anthropic"
  end

  test "available_providers returns all configured providers" do
    ENV["OLLAMA_API_BASE"] = "http://localhost:11434"
    ENV["OPENAI_API_KEY"] = "sk-test"
    ENV["ANTHROPIC_API_KEY"] = "sk-ant-test"

    providers = AiService.available_providers

    assert_includes providers, "ollama"
    assert_includes providers, "openai"
    assert_includes providers, "anthropic"
    assert_not_includes providers, "gemini"
    assert_not_includes providers, "openrouter"
  end
end
