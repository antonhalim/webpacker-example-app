class ServerRender
  # @return [ExecJS::Runtime::Context] The JS context for this renderer
  attr_reader :context

  def initialize(options={})
    js_code = options[:code] || raise("Pass `code:` option to instantiate a JS context!")
    @context = ExecJS.compile(GLOBAL_WRAPPER + js_code)
  end

  def render(component_name, props)
    js_executed_before = before_render(component_name, props)
    js_executed_after = after_render(component_name, props)
    js_main_section = main_render(component_name, props)
    html = render_from_parts(js_executed_before, js_main_section, js_executed_after)
  rescue ExecJS::ProgramError => err
    Rails.logger.debug err.message
  end

  # Hooks for inserting JS before/after rendering
  def before_render(component_name, props); ""; end
  def after_render(component_name, props); ""; end

  # Handle Node.js & other ExecJS contexts
  GLOBAL_WRAPPER = <<-JS
    var global = global || this;
    var self = self || this;
  JS

  private

  def render_from_parts(before, main, after)
    js_code = compose_js(before, main, after)
    @context.eval(js_code).html_safe
  end

  def main_render(component_name, props)
    "
    ReactDOMServer.renderToString(React.createElement(eval(#{component_name}), #{props}))
    "
  end

  def compose_js(before, main, after)
    <<-JS
      (function () {
        #{before}
        var result = #{main};
        #{after}
        return result;
      })()
    JS
  end
end
