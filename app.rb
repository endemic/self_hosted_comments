#!/usr/bin/env ruby

require "sqlite3"
require "sinatra"
require "faraday"
require "json"

ALLOWED_DOMAIN = "https://nathandemick.com"
DATABASE = if ENV["RACK_ENV"] == "test"
             "test.sqlite"
           else
             "comments.sqlite"
           end

db = SQLite3::Database.new(DATABASE)
db.results_as_hash = true

# Initialize schema if necessary
schema_init_query = <<-SQL
-- ----------------------------
--  Table structure for comments
-- ----------------------------
CREATE TABLE IF NOT EXISTS "comments" (
   "slug" text NOT NULL,
   "author" text NOT NULL,
   "url" text,
   "body" text NOT NULL,
   "timestamp" integer NOT NULL
);

-- ----------------------------
--  Indexes structure for table comments
-- ----------------------------
CREATE INDEX IF NOT EXISTS "slug_idx" ON comments ("slug");
SQL

db.execute(schema_init_query)

# -- Routes --

post "/comments" do
  response["Access-Control-Allow-Origin"] = ALLOWED_DOMAIN

  captcha_results = if ENV["RACK_ENV"] == "production"
                      verify_captcha(secret: ENV["HCAPTCHA_SECRET"],
                                     response: params["h-captcha-response"])
                    else
                      { "success" => true }
                    end

  unless captcha_results["success"]
    status 403
    return captcha_results.to_json
  end

  values = [
    params["slug"],   # slug
    params["author"], # author
    params["url"],    # url
    params["body"],   # body
    Time.now.to_i     # timestamp
  ]

  begin
    db.execute("INSERT INTO comments VALUES (?, ?, ?, ?, ?)", values)
    status 201
    return { success: true }.to_json
  rescue SQLite3::SQLException
    status 500
    return { success: false, message: 'Malformed parameters' }.to_json
  end
end

get "/comments/_count" do
  response["Access-Control-Allow-Origin"] = ALLOWED_DOMAIN

  slugs = (params["slugs"] || "").split(",")
  placeholders = (["?"] * slugs.length).join(", ")

  begin
    rows = db.execute("SELECT slug, COUNT(slug) AS count FROM comments WHERE slug IN (#{placeholders}) GROUP BY slug", slugs)

    results = {}
    rows.each_with_object(results) {|row, obj| obj[row["slug"]] = row["count"]}
    return { count: results }.to_json
  rescue SQLite3::SQLException
    status 500
    return {}.to_json
  end
end

get "/comments/:slug" do
  response["Access-Control-Allow-Origin"] = ALLOWED_DOMAIN

  rows = db.execute2("SELECT * FROM comments WHERE slug = ?", params["slug"])
  return { comments: [] }.to_json unless rows.count > 1 # execute2 returns first result as column names

  return { comments: rows[1..-1] }.to_json
end

not_found do
  return { status: 404, message: "Content not found" }.to_json
end

def verify_captcha(params)
  # Check validity of CAPTCHA
  conn = Faraday.new(url: "https://hcaptcha.com") do |faraday|
    faraday.request(:url_encoded)            # form-encode POST params
    faraday.response(:logger)                # log requests to STDOUT
    faraday.adapter(Faraday.default_adapter) # make requests with Net::HTTP
  end

  response = conn.post "/siteverify", {
    secret: params[:secret],
    response: params[:response]
  }

  begin
    json_response = JSON.parse(response.body)
  rescue JSON::ParserError
    json_response = { "success" => false }
  end

  return json_response
end
