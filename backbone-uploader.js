this.require.define({'uploader': function(exports, require, module) {
  // For drag and drop files uploader interface
  // jquery doesn't have dataTransfer in event obqect by default
  $.event.props.push('dataTransfer')

  var Uploader = Backbone.View.extend({
    className: 'b-uploader',

    initialize: function(options) {
      _(this).bindAll('_onDragEnter', '_onDrop', '_onDragLeave', '_onDragOver')
      this.files = new Files()
      this.files.url = options.url
      this.render()
      this.bindEvents()
    },
    render: function() {
      this.dragArea = $('<div>').addClass('drag-area')
        .appendTo(this.el)
        .text('Drag files here')
      return this;
    },
    addFiles: function(files) {
      var _this = this
      _(files).each(function(file) {
        _this.files.add(_.extend({file: file}, file))
      })
    },
    bindEvents: function() {
      var _this = this
      this.dragArea.on('dragenter', this._onDragEnter)
      this.dragArea.on('dragover', this._onDragOver)
      this.dragArea.on('drop', this._onDrop)
      this.dragArea.on('dragleave', this._onDragLeave)
      this.dragArea.on('dragend', this._onDragLeave)
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
    }
  })

  // file model
  var File = Backbone.Model.extend({
    initialize: function() {
      _(this).bindAll('_onLoad', '_onError', '_onProgress')
    },
    upload: function() {
      var xhr = this.xhr()
      xhr.open('POST', this.url())
      xhr.send(this.data())
    },
    data: function() {
      var data = new FormData()
      data.append('file', this.get('file'))
      data.append(this._csrfParam, this._csrfToken)
      return data
    },
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
      console.log(file)
      file.upload()
    }
  })

  module.exports = Uploader
}})

