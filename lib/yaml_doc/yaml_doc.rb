#!/usr/bin/env ruby
require "rubygems"
require "erb"
require "yaml"
require "pp"
require "rdiscount"

module YamlDoc
  module Helpers

    def theme_signature(m)
      %[<pre class="signature"><code>] +
      (m.return_type ? %[<em>#{m.return_type}</em> ] : '') +
      %[<strong>#{m.name}</strong>(] +
      m.params.map { |it| theme_param(it) }.join(', ') +
      %[)</code></pre>]
    end

    def theme_param(p)
      x = ''
      x << p.name
      x << '=' + p.default_value unless p.default_value.empty?
      x = "<em>#{x}</em>" if p.optional?
      x
    end

    def theme_method(m)
      o = ''
      o << markdown(m.short) if !m.short.empty?
      o << theme_signature(m)
      if !m.params.empty?
        o << '<div class="arguments">'
        o << '<h5>Arguments</h5>'
        o << '<dl>'
        m.params.each do |p|
          o << "<dt>#{p.name}</dt>"
          o << "<dd><em>#{p.type}</em>#{' (optional)' if p.optional?}. #{p.description}</dd>"
        end
        o << '</dl>'
        o << '</div>'
      end
      if !m.return_type.empty? || !m.return_description.empty?
        o << '<div class="returns">'
        o << '<h5>Returns</h5>'
        o << '<p>'
        o << "<em>#{m.return_type}</em> " unless m.return_type.empty?
        o << m.return_description unless m.return_description.empty?
        o << '</p>'
        o << '</div>'
      end
      o << markdown(m.description) if !m.description.empty?
      o
    end

    def markdown m
      RDiscount.new(m).to_html
    end
  end
end

module YamlDoc
  
  def self.copy_assets_to dir
    cp_r File.join(File.dirname(__FILE__), 'assets'), dir
  end
  
  class Engine
    attr_reader :symbols, :library, :description
    
    include Helpers
    
    def initialize
      @id_count = {}
    end
    
    def self.load file
      self.new.load(file).run
    end
    
    def load file
      @data = YAML.load_file file
      @library = @data['library']
      @description = @data['description']
      self
    end
    
    def run
      @symbols = @data['symbols'].map do |dfn|
        if dfn['is_class']
          o = Klass.new dfn, self
        elsif dfn['is_constructor']
          o = Constructor.new dfn, self
        elsif dfn['is_function']
          o = Method.new dfn, self
        else
          o = Subject.new dfn, self
        end
        o
      end
      self
    end
    
    def klasses
      symbols.select { |sym| sym.is_a? Klass }
    end
    
    def get_id name
      id = name.downcase.gsub('#', ':')
      if @id_count[id]
        @id_count[id] += 1
        id = "#{id}-#{@id_count[id]}"
      else
        @id_count[id] = 0
      end
      id
    end
    
    def license
      @data['license'] || ''
    end
    
    def to_html
      ERB.new(File.read(File.join(File.dirname(__FILE__), 'templates', 'index.erb'))).result(binding)
    end
    
  end
  
  
  class Subject
    attr_reader :engine, :id
    
    def initialize dfn, engine
      @attrs = dfn
      @engine = engine
      @id = engine.get_id name 
    end

    def name
      @attrs['name']
    end
    
    def short
      @attrs['short'] || ''
    end
    
    def description
      @attrs['description'] || ''
    end
    
  end
  
  class Klass < Subject
    
    def klass_properties
      @properties ||= @attrs['properties'].map! { |p| Property.new p }
    end
        
    def klass_methods
      engine.symbols.select { |s| s.name.match("^#{name}\\.") }.sort_by { |s| s.name }
    end
    
    def instance_methods
      engine.symbols.select { |s| s.name.match("^#{name}#") }.sort_by { |s| s.name }
    end
    
    def constructor
      engine.symbols.find { |s| s.is_a?(Constructor) && s.name == name }
    end
  end
  
  class Method < Subject
    
    attr_reader :params
    
    def initialize dfn, engine
      super(dfn, engine)
      @params = (@attrs['params'] || []).map { |p| Param.new(p) }
    end
    
    def local_name
      name.split(/[.#]/).last
    end
    
    def return_type
      @attrs['returns'] && @attrs['returns']['type'] || ''
    end
    
    def return_description
      @attrs['returns'] && @attrs['returns']['description'] || ''
    end

  end
  
  class Constructor < Method
  end
  
  class Param
    attr_reader :type, :description, :default_value
    
    def initialize dfn
      @attrs = dfn
      @type = dfn['type']
      @optional = dfn['is_optional']
      @description = dfn['description']
      @default_value = optional? && dfn['default'] || ''
    end

    def optional?
      @optional
    end
    
    def name
      # 'xxxx'
      @attrs['name']
    end
        
  end
  
  class Property < Param
  end
  
  
end
