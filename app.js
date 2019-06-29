window.addEventListener('load', function() {
  const infoElement = document.getElementById('code');
  
  document.addEventListener('keydown', function(event) {
    infoElement.textContent += ` ${event.code}`;
    console.log(event);
  });
})
