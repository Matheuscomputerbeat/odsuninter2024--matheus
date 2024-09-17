document.addEventListener('mousemove', function(e) {
  const spotlight = document.querySelector('.spotlight');
  spotlight.style.left = e.pageX - spotlight.clientWidth / 2 + 'px';
  spotlight.style.top = e.pageY - spotlight.clientHeight / 2 + 'px';
});
