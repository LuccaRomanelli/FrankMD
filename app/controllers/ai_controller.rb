# frozen_string_literal: true

class AiController < ApplicationController
  skip_forgery_protection only: [ :fix_grammar ]

  # GET /ai/config
  def config
    render json: AiService.provider_info
  end

  # POST /ai/fix_grammar
  def fix_grammar
    text = params[:text].to_s

    if text.blank?
      return render json: { error: "No text provided" }, status: :bad_request
    end

    result = AiService.fix_grammar(text)

    if result[:error]
      render json: { error: result[:error] }, status: :unprocessable_entity
    else
      render json: {
        corrected: result[:corrected],
        provider: result[:provider],
        model: result[:model]
      }
    end
  end
end
