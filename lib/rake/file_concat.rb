module Rake
  class FileConcatTask < FileTask
        
    def initialize(*args, &block)
      require "pp"
      @concat_list = []
      super
    end
    
    def add(*args, &block)
      enhance(args, &block)
      args.each { |a| @concat_list << a }
    end
    
    def execute(args=nil)
      require "erb"
      enhance do |t|
        File.open(t.name, 'w+') do |f|
          f << @concat_list.map do |item|
            ERB.new(IO.read(File.expand_path(item)), nil, '%').result(binding)
          end * $/
        end        
      end
      super
    end
    
  end
end


def file_concat(*args, &block)
  Rake::FileConcatTask.define_task(*args, &block)
end
