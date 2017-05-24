// ------------------------------- STARTUP INTIALIZATION ----------------------
Meteor.startup(function()
{ // set session/localStorage variables to defaults if not set (3 cases below)
	if ( !Session.get('primaryAction') )
	{
		// folder fab
		Session.set('primaryAction', 'ion-arrow-resize')
		Session.set('secondaryAction', 'ion-folder')
		Session.set('tertiaryAction', 'ion-ios-bell')
		Session.set('quaternaryAction', 'ion-document-text')
		// list fab
		Session.set('primaryActionL', 'ion-plus')
		Session.set('secondaryActionL', 'ion-android-calendar')
		Session.set('tertiaryActionL', 'ion-android-done')
		Session.set('quaternaryActionL', 'ion-arrow-move')
    // cal fab
    Session.set('primaryActionC', 'ion-clipboard')
    Session.set('secondaryActionC', 'ion-plus')	
	}
	if ( !Session.get('currPage') )
		Session.set('currPage', 'todolyst')
	if ( !localStorage.getItem('userId') && !localStorage.getItem('anonUserId') )
	{
		var anonUserId = Random.id()
		localStorage.setItem('anonUserId', anonUserId)
		Folders.insert({name: 'rootFolder', root: true, createdBy: anonUserId})
    Session.set('setRootFolder', true)
	}
})

// ---------------------------- RENDERED SCRIPT INITIALIZATIONS ----------------------

// complete/dismiss jquery/materialize init, also handles c/d event callbacks
Template.dismissableRenderedHook.rendered = function()
{ // from materialize.js, enables dismissable collections
	  swipeLeft = false; swipeRight = false; 

  $('.dismissable').each(function() {
    $(this).hammer({
      prevent_default: false
    }).bind('pan', function(e) {
      if (e.gesture.pointerType === "touch") {
        var $this = $(this);
        var direction = e.gesture.direction;
        var x = e.gesture.deltaX;
        var velocityX = e.gesture.velocityX;

        $this.velocity({ translateX: x
            }, {duration: 50, queue: false, easing: 'easeOutQuad'});

        // Swipe Left
        if (direction === 4 && (x > ($this.innerWidth() / 2) || velocityX < -0.75)) {
          swipeLeft = true;
          $('.dismissableCollection').removeClass('red')
          $('.dismissableCollection').addClass('green lighten-2')
        }

        // Swipe Right
        if (direction === 2 && (x < (-1 * $this.innerWidth() / 2) || velocityX > 0.75)) {
          swipeRight = true;
          $('.dismissableCollection').removeClass('green')
          $('.dismissableCollection').addClass('red lighten-2')
        }
      }
    }).bind('panend', function(e) {
      // Reset if collection is moved back into original position
      if (Math.abs(e.gesture.deltaX) < ($(this).innerWidth() / 2)) {
        swipeRight = false; swipeLeft = false;
      }

      if (e.gesture.pointerType === "touch") {
        var $this = $(this);
        if (swipeLeft || swipeRight) {
          var fullWidth;
          if (swipeLeft) // COMPLETE TASK
          { 
           fullWidth = $this.innerWidth();
           var taskId =  $(this).children().attr("id")
           Lists.update({_id: Session.get('currPageId')}, {$inc: {children: -1}})
            Meteor.setTimeout(function()// allow time for animation 
            {
              Tasks.update({_id: taskId}, {$set: {status: "completed"} }) 
            }, 200) 
          }
          else // DISMISS TASK
          {
            fullWidth = -1 * $this.innerWidth(); 
            var taskId =  $(this).children().attr("id")
            Lists.update({_id: Session.get('currPageId')}, {$inc: {children: -1}})
            Meteor.setTimeout(function()// allow time for animation 
            {
              Tasks.update({_id: taskId}, {$set: {status: "dismissed"} }) 
            }, 200) 
          }

          $this.velocity({ translateX: fullWidth,
            }, {duration: 100, queue: false, easing: 'easeOutQuad', complete:
            function() {
              $this.css('border', 'none');
              $this.velocity({ height: 0, padding: 0,
                }, {duration: 200, queue: false, easing: 'easeOutQuad', complete:
                  function() { $this.remove(); }
                });
            }
          });
        }
        else {
          $this.velocity({ translateX: 0,
            }, {duration: 100, queue: false, easing: 'easeOutQuad'});
        }
        swipeLeft = false; swipeRight = false;
      }
    });

  });
}

Template.sortableRenderedHook.rendered = function()
{ //line below is touchpunch script to make jquery-ui work on mobile devices
	!function(a){function f(a,b){if(!(a.originalEvent.touches.length>1)){a.preventDefault();var c=a.originalEvent.changedTouches[0],d=document.createEvent("MouseEvents");d.initMouseEvent(b,!0,!0,window,1,c.screenX,c.screenY,c.clientX,c.clientY,!1,!1,!1,!1,0,null),a.target.dispatchEvent(d)}}if(a.support.touch="ontouchend"in document,a.support.touch){var e,b=a.ui.mouse.prototype,c=b._mouseInit,d=b._mouseDestroy;b._touchStart=function(a){var b=this;!e&&b._mouseCapture(a.originalEvent.changedTouches[0])&&(e=!0,b._touchMoved=!1,f(a,"mouseover"),f(a,"mousemove"),f(a,"mousedown"))},b._touchMove=function(a){e&&(this._touchMoved=!0,f(a,"mousemove"))},b._touchEnd=function(a){e&&(f(a,"mouseup"),f(a,"mouseout"),this._touchMoved||f(a,"click"),e=!1)},b._mouseInit=function(){var b=this;b.element.bind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),c.call(b)},b._mouseDestroy=function(){var b=this;b.element.unbind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),d.call(b)}}}(jQuery);
	$( ".sortable" ).sortable(); 	$( ".sortable" ).disableSelection()
}

// HANDLES SUBMIT EVENT FOR DATEPICKER
Template.datepickerRenderedHook.rendered = function() // just date (no time) right now
{ // DATEPICKER JQUERY INITIALIZATION
  $('.datepicker').pickadate
  ({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 5, // Creates a dropdown of 15 years to control year
    close: 'add',
    onClose: function()
    {
      var dateInput = $('#fabInputBar').val()
      if (dateInput.length > 0)
      {
        var datetime = new Date( $('#fabInputBar').val() )  
        var month = datetime.getMonth(); 
        var day = datetime.getDate(); 
        var year = datetime.getFullYear()
        Tasks.update({_id: Session.get('selectedTask')}, {$set: 
          {month: month, day: day, year: year}, })
        $('#fabInputBar').val(''); 
      }
      $('.selectedTask').removeClass('selectedTask'); Session.delete('selectedTask')
    }
  })
}


// USER ACCOUNTS PARALLAX 
Template.userAccounts.rendered = function()
{
  if (Meteor.userId())
    $('.parallax').parallax()
}