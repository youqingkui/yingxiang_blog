// Generated by CoffeeScript 1.8.0
(function() {
  $(document).ready(function() {
    var urlName;
    urlName = location.pathname;
    if (urlName === '/') {
      $(".main-nav a").removeClass();
      $("#home").addClass('selected').addClass('active').addClass('current');
    }
    if (urlName === '/archive') {
      $(".main-nav a").removeClass();
      return $("#archive").addClass('selected').addClass('active').addClass('current');
    }
  });

}).call(this);

//# sourceMappingURL=link.js.map
