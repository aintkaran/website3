/* Preloader failsafe: if the preloader module never runs (old browser,
   blocked script), hide the overlay so nobody is stuck behind it.
   External file so the Content-Security-Policy can stay 'self'-only. */
setTimeout(function () {
  var p = document.getElementById('preloader');
  if (p && !p.dataset.done) { p.classList.add('done'); setTimeout(function () { p.remove(); }, 400); }
}, 4000);
