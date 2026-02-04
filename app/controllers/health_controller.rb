class HealthController < ActionController::Base
  def show
    response.headers["Access-Control-Allow-Origin"] = "*"
    render plain: "OK"
  end
end
