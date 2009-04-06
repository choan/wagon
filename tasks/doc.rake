DOC_DIR = File.join APP_ROOT, 'doc'

directory DOC_DIR

CLOBBER.include DOC_DIR


namespace :doc do
  task :build => [DOC_DIR] do
    require "yaml_doc/yaml_doc"
    
    File.open(File.join(DOC_DIR, 'index.html'), 'w+') do |f|
      f.puts YamlDoc::Engine.load('src/wagon.yaml').to_html
    end
    
    YamlDoc.copy_assets_to DOC_DIR

  end
end

task :doc => [ 'doc:build' ]