#!/usr/bin/env ruby

require "sqlite3"
require "sinatra"
require "faraday"
require "json"

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
  response['Access-Control-Allow-Origin'] = '*'

  captcha_results = if ENV["RACK_ENV"] == "production"
                      verify_captcha(secret: ENV["RECAPTCHA_SECRET"],
                                     response: params["g-recaptcha-response"],
                                     remoteip: request.ip)
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
    return { success: true }.to_json
  rescue SQLite3::SQLException
    status 500
    return { success: false, message: 'Malformed parameters' }.to_json
  end
end

get "/comments/:slug" do
  response['Access-Control-Allow-Origin'] = '*'

  rows = db.execute2("SELECT * FROM comments WHERE slug = ?", params["slug"])
  return { comments: [] }.to_json unless rows.count > 1 # execute2 returns first result as column names

  { comments: rows[1..-1] }.to_json
end

not_found do
  { status: 404, message: "Content not found" }.to_json
end

def verify_captcha(params)
  # Check validity of CAPTCHA
  conn = Faraday.new(url: "https://www.google.com") do |faraday|
    faraday.request(:url_encoded)            # form-encode POST params
    faraday.response(:logger)                # log requests to STDOUT
    faraday.adapter(Faraday.default_adapter) # make requests with Net::HTTP
  end

  response = conn.post "/recaptcha/api/siteverify", {
    secret: params[:secret],
    response: params[:response],
    remoteip: params[:remoteip]
  }

  begin
    json_response = JSON.parse(response.body)
  rescue JSON::ParserError
    json_response = { "success" => false }
  end

  return json_response
end
