var updateURL = function(url) {
  var s = document.getElementById('src-url-id');
  s.innerHTML = url;
};

window.addEventListener('click', function(event) {
  var t = event.target;
  if(t.id=='button-yes-id' || t.id=='button-no-id') {
    var ch = (t.id=='button-yes-id');
    var checkbox = document.getElementById('remember-choice-id');
    var remember = checkbox.checked;
    
    var payload = { choice: ch,
                    remember: remember };
    self.port.emit('choice-selected',payload);
  }
});
