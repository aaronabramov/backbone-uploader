// Backbone file uploader
//
// example:
//
// layout:
//   <div class="b-uploader"></div>
//
//
// initialize:
//   var Uploader = require('uploader')
//   new Uploader({
//     el: $('.b-uploader'),
//     url: "/api/upload"
//   })
//
// backend (e.g. RoR):
//   def create
//     file = File.create(file: params[:file])
//     render json: File.as_json
//   end


this.require.define({'uploader': function(exports, require, module) {
  // For drag and drop files uploader interface
  // jquery doesn't have dataTransfer in event obqect by default
  $.event.props.push('dataTransfer')

  // Main view
  var Uploader = Backbone.View.extend({
    // class name if element is not set directly
    className: 'b-uploader',

    initialize: function(options) {
      _(this).bindAll('_onDragEnter', '_onDrop', '_onDragLeave', '_onDragOver', '_onFileAdd')
      // files collection
      this.files = new Files()
      this.files.url = options.url
      this.render()
      // define cached element for files container
      // TODO: enable setting from outside
      this.filesContainer = $('<div>').addClass('files-container').appendTo(this.el)
      this.bindEvents()
    },
    render: function() {
      this.dragArea = $('<div>').addClass('drag-area')
        .appendTo(this.el)
        .text('Drag files here')
      return this;
    },
    // add files to collection
    addFiles: function(files) {
      var _this = this
      _(files).each(function(file) {
        _this.files.add(_.extend({file: file}, file))
      })
    },
    bindEvents: function() {
      this.dragArea.on('dragenter', this._onDragEnter)
      this.dragArea.on('dragover', this._onDragOver)
      this.dragArea.on('drop', this._onDrop)
      this.dragArea.on('dragleave', this._onDragLeave)
      this.dragArea.on('dragend', this._onDragLeave)
      this.files.on('add', this._onFileAdd)
    },
    _onDragEnter: function(e) {
      this.dragArea.addClass('drag-over')
    },
    _onDragOver: function(e) {
      // to prevent default action after drop
      e.preventDefault() && e.stopPropagation()
    },
    _onDrop: function(e) {
      e.preventDefault()
      this.addFiles(e.dataTransfer.files)
      this.dragArea.removeClass('drag-over')
    },
    _onDragLeave: function(e) {
      this.dragArea.removeClass('drag-over')
    },
    // callback function for add event on
    // files collection. initialize and render
    // file view and append it to files container
    _onFileAdd: function(file) {
      var view = new View({model: file})
      this.filesContainer.append(view.render().el)
    }
  })

  // file model
  var File = Backbone.Model.extend({
    initialize: function() {
      _(this).bindAll('_onLoad', '_onError', '_onProgress')
    },
    // send xhr request to the server
    upload: function() {
      var xhr = this.xhr()
      xhr.open('POST', this.url())
      xhr.send(this.data())
    },
    // initialize formData and specify uploaded file
    // and rails csrf token
    data: function() {
      var data = new FormData()
      data.append('file', this.get('file'))
      data.append(this._csrfParam, this._csrfToken)
      return data
    },
    // return instance of XMLHttpRequest and proxy all
    // events to this model
    xhr: function() {
      var xhr = new XMLHttpRequest()
      xhr.addEventListener('load', this._onLoad)
      xhr.addEventListener('error', this._onError)
      xhr.upload.addEventListener('progress', this._onProgress)
      return xhr
    },
    _onLoad: function(e) {
      this.trigger('load', e)
      console.log(JSON.parse(e.target.responseText))
    },
    _onError: function(e) {
      this.trigger('error', e)
    },
    _onProgress: function(e) {
      this.trigger('progress', e)
    },
    _csrfParam: function() {
      return csrf[$('meta[name=csrf-param]').attr('content')]
    },
    _csrfToken: function() {
      return $('meta[name=csrf-token]').attr('content')
    }
  })

  // files collection
  var Files = Backbone.Collection.extend({
    model: File,

    initialize: function() {
      _(this).bindAll('_add')
      this.on('add', this._add)
    },
    _add: function(file) {
      file.upload()
    }
  })

  // template for file view
  // TODO: make configurable
  var fileTemplate = _.template('<p>Name: <%= name %></p><div class="progress"><div class="bar"></div></div>')

  var View = Backbone.View.extend({
    template: fileTemplate,

    initialize: function() {
      _(this).bindAll('_onProgress')
      this.bindEvents()
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()))
      this.bar = this.$('.bar')
      return this
    },
    bindEvents: function() {
      this.model.on('progress', this._onProgress)
    },
    // set width of progress bar to current file position
    progress: function(percentage) {
      this.bar.css('width', percentage + '%')
    },
    _onProgress: function(e) {
      var total = e.totalSize || e.total,
      loaded = e.position || e.loaded
      this.progress(100 * (loaded / total))
    },
  })

  module.exports = Uploader
}})
