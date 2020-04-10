require "./app"

require "minitest/autorun"
require "rack/test"

require "sqlite3"
require "json"
require "securerandom"

class AppTest < Minitest::Test
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end

  def teardown
    SQLite3::Database.new("test.sqlite")
                     .execute("DELETE FROM comments")
  end

  def test_post_and_get
    slug = "test_post_and_get"

    post "/comments", { slug: slug, author: "nathan", body: "this is a comment" }
    assert_equal 201, last_response.status

    get "/comments/#{slug}"
    json_response = JSON.parse(last_response.body)

    expected = slug
    actual = json_response["comments"].first["slug"]

    assert_equal(expected, actual)
  end

  def test_get_multiple_results
    slug = "test_get_multiple_results"

    post "/comments", { slug: slug, author: "nathan", body: "comment #1" }
    assert_equal 201, last_response.status

    post "/comments", { slug: slug, author: "nathan", body: "comment #2" }
    assert_equal 201, last_response.status

    post "/comments", { slug: slug, author: "nathan", body: "comment #3" }
    assert_equal 201, last_response.status

    get "/comments/#{slug}"
    json_response = JSON.parse(last_response.body)

    expected = 3
    actual = json_response["comments"].count

    assert_equal(expected, actual)
  end

  def test_get_not_found
    get "/comments/garbage"
    assert_equal 200, last_response.status
    json_response = JSON.parse(last_response.body)

    expected = []
    actual = json_response["comments"]

    assert_equal(expected, actual)
  end

  def test_get_count
    slug = "test_get_count"

    post "/comments", { slug: slug, author: "nathan", body: "this is a comment" }

    get "/comments/_count", { slugs: [slug, "garbage"].join(",") }
    json_response = JSON.parse(last_response.body)

    expected = 1
    actual = json_response["count"][slug]

    assert_equal(expected, actual)
    assert_nil(json_response["count"]["garbage"])
  end
end
