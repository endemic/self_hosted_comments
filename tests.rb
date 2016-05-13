require "./app"
require "minitest/autorun"
require "rack/test"
require "json"
require "securerandom"

class AppTest < Minitest::Test
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end

  def test_post_and_get
    slug = SecureRandom.hex

    post "/comments", { slug: slug, name: "nathan", body: "this is a comment" }
    assert_equal 201, last_response.status

    get "/comments/#{slug}"
    json_response = JSON.parse(last_response.body)
    assert_equal json_response.first["slug"], slug
  end

  def test_get_multiple_results
    slug = SecureRandom.hex

    post "/comments", { slug: slug, name: "nathan", body: "this is a comment" }
    post "/comments", { slug: slug, name: "nathan", body: "this is a comment" }
    post "/comments", { slug: slug, name: "nathan", body: "this is a comment" }

    get "/comments/#{slug}"
    json_response = JSON.parse(last_response.body)
    assert_equal json_response.count, 3
  end

  def test_get_not_found
    get "/comments/garbage"
    assert_equal 404, last_response.status
  end
end
