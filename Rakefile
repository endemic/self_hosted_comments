task :default => [:test]

task :test do
  sh 'RACK_ENV=test ruby tests.rb'
end

task :server do
  sh 'ruby app.rb'
end
