(function() {
  const initialize = function() {
    const _className = 'active';
    const _menuToggle = document.querySelector('#menu-toggle');
    const _menuDrawer = document.querySelector('#menu-drawer');

    let _isActive = _menuToggle.classList.contains(_className);

    _menuToggle.addEventListener('click', function(_event) {
      if (_isActive) {
        _isActive = false;
        _menuToggle.classList.remove(_className);
        _menuDrawer.classList.remove(_className);
      } else {
        _isActive = true;
        _menuToggle.classList.add(_className);
        _menuDrawer.classList.add(_className);
      }
    });
  }
  
  if (document.readyState == 'interactive' || document.readyState == 'complete') {
    initialize();
  } else {
    document.addEventListener('DOMContentLoaded', initialize);
  }
}());
