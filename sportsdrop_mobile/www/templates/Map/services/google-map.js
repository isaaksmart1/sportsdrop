angular.module('service.map', [])

  .service('GoogleMaps', function ($q) {

    // create map instance
    function gmapLib() {
      var mapElement = document.getElementById('gmapLib');
      var mapOptions = {
        zoom: 15,
        minZoom: 3,
        styles: MAP_STYLE,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(mapElement, mapOptions);
      MAP_INSTANCE = map;
    }

    // create script element to insert into the page
    function createMapScript(key, cb) {
      if (!cb)
        cb = '';
      var element = document.getElementById('googleMaps');
      if (typeof (element) != 'undefined' && element != null)
        return true;
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.id = "googleMaps";
      // note the callback function in the URL is the one we created above
      if (key) {
        script.src = 'https://maps.google.com/maps/api/js?key=' + key +
          '&callback=' + cb + '&libraries=places';
      } else {
        script.src = 'https://maps.google.com/maps/api/js?&callback=' + cb + '&libraries=places';
      }
      document.body.appendChild(script);
    }

    // add information window css styling
    function applyInfoStyles() {
      // Reference to the DIV which receives the contents of the infowindow
      var iwOuter = document.getElementsByClassName('gm-style-iw');
      var iw = document.getElementById('iw-container');
      // Acquire children for iwOuter element and add custom class
      var iwOuterChild = iwOuter[0].children[0];
      iwOuterChild.classList.add('gm-style-iw-child');
      // Reference the previous DIV
      var iwBackground = iwOuter[0].previousElementSibling;
      // Remove the background shadow DIV
      iwBackground.children[1].style.display = 'none';
      // Remove the white background DIV
      iwBackground.children[3].style.display = 'none';
      // Modify the close button
      var iwClose = iwOuter[0].nextElementSibling;
      // iwClose.classList.add('iw-close-button');
      iwClose.innerHTML = '';
      iwClose.style.opacity = 1;
      iwClose.style.right = '62px';
      iwClose.style.top = '31px';
      iwClose.style.width = '20px';
      iwClose.style.height = '20px';
      iwClose.style.color = '#fff';
      iwClose.style.fontSize = '30px';
    }

    // create a customized animation for marker
    function customMarker() {
      return $q(function (resolve, reject) {
        if (google) {
          pinAnimation.prototype = new google.maps.OverlayView();
          pinAnimation.prototype.onAdd = function () {
            // overlay shadow puts the animation behind the pin
            var pane = this.getPanes().overlayShadow;
            pane.appendChild(this.div_);
            // ensures the animation is redrawn if the text or position is changed.
            var redraw_ = this;
            this.listeners_ = [
              google.maps.event.addListener(this, 'position_changed',
                function () {
                  redraw_.draw();
                }),
            ];
          };
          pinAnimation.prototype.onRemove = function () {
            this.div_.parentNode.removeChild(this.div_);
            // pinAnimation is removed from the map, stop updating its position/any other listeners added.
            for (var i = 0, I = this.listeners_.length; i < I; ++i) {
              google.maps.event.removeListener(this.listeners_[i]);
            }
          };
          pinAnimation.prototype.hide = function () {
            if (this.div_) {
              this.div_.style.visibility = 'hidden';
            }
          };
          pinAnimation.prototype.show = function () {
            if (this.div_) {
              this.div_.style.visibility = 'visible';
            }
          };
          pinAnimation.prototype.draw = function () {
            var topPadding = 0;
            var sizeHeight = 50;
            var sizeWidth = sizeHeight;
            var centerX = sizeWidth / 2;
            var centerY = sizeHeight / 2;
            var projection = this.getProjection();
            var position = projection.fromLatLngToDivPixel(this.get('position'));
            var div = this.div_;
            // adjust overlay position to be centered over the point
            div.style.left = position.x - centerX + 'px';
            div.style.top = position.y - topPadding - centerY + 'px';
            div.style.display = 'block';
          };
          return resolve(true);
        }
        return reject(false);
      });
    }

    // define the animated overlay
    function pinAnimation(options) {
      this.setValues(options);
      var div = this.div_ = document.createElement('div');
      var span = this.span_ = document.createElement('span');
      div.id = 'markerLoc';
      span.className = 'pulse';
      div.appendChild(span);
    }

    return {
      applyInfoStyles: applyInfoStyles,
      animate: pinAnimation,
      createMapScript: createMapScript,
      customMarker: customMarker,
      gmapLib: gmapLib
    };
  });
