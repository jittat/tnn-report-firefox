var updateURL = function(url) {
  var s = document.getElementById('src-url-id');
  s.innerHTML = url;
};

window.addEventListener('click', function(event) {
  var t = event.target;
  if(t.id == 'button-yes-id')
    self.port.emit('choice-selected',true);
  if(t.id == 'button-no-id')
    self.port.emit('choice-selected',false);
});
