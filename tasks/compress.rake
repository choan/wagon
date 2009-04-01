desc "Compress the distribution file with YUI compressor"
task :compress => :dist do
  yuic = ENV['YUI_COMPRESSOR_JAR']
  puts "You must set YUI_COMPRESSOR_JAR to use the :compress task" unless yuic
  chdir APP_DIST_DIR do
    sh %[java -jar #{yuic} --charset utf-8 -o #{APP_NAME}-c.js #{APP_FILE_NAME}]
  end
end