/**
 *
 * SoundManager 2 Demo: Play MP3 links "in-place"
 * ----------------------------------------------
 *
 * http://schillmania.com/projects/soundmanager2/
 *
 * A simple demo making MP3s playable "inline"
 * and easily styled/customizable via CSS.
 *
 * Requires SoundManager 2 Javascript API.
 *
 */

function InlinePlayer() {
    var self = this;
    var pl = this;
    var sm = soundManager; // soundManager instance
    var isIE = (navigator.userAgent.match(/msie/i));
    this.playableClass = 'inline-playable'; // CSS class for forcing a link to be playable (eg. doesn't have .MP3 in it)
    this.excludeClass = 'inline-exclude'; // CSS class for ignoring MP3 links
    this.links = [];
    this.sounds = [];
    this.soundsByURL = [];
    this.indexByURL = [];
    this.lastSound = null;
    this.soundCount = 0;
    this.curr_focus = null;
    
    this.table = {
    	dimensions: {
    		cols: 5,
    		rows: 5
    	},
    	transposed: true,
    	isStereo: true
   	}

    this.config = {
        playNext: false, // stop after one sound, or play through list until end
        autoPlay: false // start playing the first sound right away
    }

    this.css = {
        // CSS class names appended to link during various states
        sDefault: 'sm2_link', // default state
        sLoading: 'sm2_loading',
        sPlaying: 'sm2_playing',
        sPaused: 'sm2_paused'
    }

    this.addEventHandler = function(o, evtName, evtHandler){ 
    	// refactor for jQuery event binding
    	// .on( events [, selector ] [, data ], handler )
    	o.on( evtName, evtHandler );
    };
    
    /* Old, two-pronged solution for event binding
    (typeof window.addEventListener !== 'undefined' ? 
	    function(o, evtName, evtHandler) {
	        return o.addEventListener(evtName, evtHandler, false);
	    } : 
	    function(o, evtName, evtHandler) {
	        o.attachEvent('on' + evtName, evtHandler);
	    }
	  ); */

		// **********************************************

		/* This never seems to be called anywhere
    this.removeEventHandler = (typeof window.removeEventListener !== 'undefined' ? function(o, evtName, evtHandler) {
        return o.removeEventListener(evtName, evtHandler, false);
    } : function(o, evtName, evtHandler) {
        return o.detachEvent('on' + evtName, evtHandler);
    });
    */

    this.classContains = function(o, cStr) {
        return (typeof(o.className) != 'undefined' ? o.className.match(new RegExp('(\\s|^)' + cStr + '(\\s|$)')) : false);
    }

    this.addClass = function(o, cStr) {
    		/*
    		$o = o;
    		$o.addClass( cStr ); // jQuery
    		*/
        
        if (!o || !cStr || self.classContains(o, cStr)) return false;
        o.className = (o.className ? o.className + ' ' : '') + cStr;
        
    }

    this.removeClass = function(o, cStr) {
        if (!o || !cStr || !self.classContains(o, cStr)) return false;
        o.className = o.className.replace(new RegExp('( ' + cStr + ')|(' + cStr + ')', 'g'), '');
    }

    this.getSoundByURL = function(sURL) {
        return (typeof self.soundsByURL[sURL] != 'undefined' ? self.soundsByURL[sURL] : null);
    }

    this.isChildOfNode = function(o, sNodeName) {
        if (!o || !o.parentNode) {
            return false;
        }
        sNodeName = sNodeName.toLowerCase();
        do {
            o = o.parentNode;
        } while (o && o.parentNode && o.nodeName.toLowerCase() != sNodeName);
        return (o.nodeName.toLowerCase() == sNodeName ? o : null);
    }

    this.events = {

        // handlers for sound events as they're started/stopped/played

        play: function() {
            pl.removeClass(this._data.oLink, this._data.className);
            this._data.className = pl.css.sPlaying;
            pl.addClass(this._data.oLink, this._data.className);
        },

        stop: function() {
            pl.removeClass(this._data.oLink, this._data.className);
            this._data.className = '';
        },

        pause: function() {
            pl.removeClass(this._data.oLink, this._data.className);
            this._data.className = pl.css.sPaused;
            pl.addClass(this._data.oLink, this._data.className);
        },

        resume: function() {
            pl.removeClass(this._data.oLink, this._data.className);
            this._data.className = pl.css.sPlaying;
            pl.addClass(this._data.oLink, this._data.className);
        },

        finish: function() {
            pl.removeClass(this._data.oLink, this._data.className);
            this._data.className = '';
            if (pl.config.playNext) {
                var nextLink = (pl.indexByURL[this._data.oLink.href] + 1);
                if (nextLink < pl.links.length) {
                    pl.handleKeystroke({
                        'target': pl.links[nextLink]
                    });
                }
            }
        }

    }

    this.stopEvent = function(e) {
        if (typeof e != 'undefined' && typeof e.preventDefault != 'undefined') {
            e.preventDefault();
        } else if (typeof event != 'undefined' && typeof event.returnValue != 'undefined') {
            event.returnValue = false;
        }
        return false;
    }

    this.getTheDamnLink = (isIE) ? function(e) {
        // I really didn't want to have to do this.
        return (e && e.target ? e.target : window.event.srcElement);
    } : function(e) {
        return e.target;
    }

    this.handleKeystroke = function(e) {
        // a sound link was keystroked
        
        // Debugging
        /*
        console.clear();
        self.curr_focus = $(document.activeElement);
        console.log('Current focus: ' + self.curr_focus.html());
        */
                
        var o = self.getTheDamnLink(e);
        if (o.nodeName.toLowerCase() != 'a') {
            o = self.isChildOfNode(o, 'a');
            if (!o) return true;
        }
        var sURL = o.getAttribute('href');
        if (!o.href || (!sm.canPlayLink(o) && !self.classContains(o, self.playableClass)) || self.classContains(o, self.excludeClass)) {
            return true; // pass-thru for non-MP3/non-links
        }
        var soundURL = (o.href);
        var thisSound = self.getSoundByURL(soundURL);
        if (thisSound) {
            // already exists
            if (thisSound == self.lastSound) {
                // and was playing (or paused)
                thisSound.togglePause();
            } else {
                // different sound
                sm._writeDebug('sound different than last sound: ' + self.lastSound.id);
                if (self.lastSound) {
                    self.stopSound(self.lastSound);
                }
                thisSound.togglePause(); // start playing current
            }
        } else {
            // stop last sound
            if (self.lastSound) {
                self.stopSound(self.lastSound);
            }
            // create sound
            thisSound = sm.createSound({
                id: 'inlineMP3Sound' + (self.soundCount++),
                url: soundURL,
                pan: self.setPanning(),
                onplay: self.events.play,
                onstop: self.events.stop,
                onpause: self.events.pause,
                onresume: self.events.resume,
                onfinish: self.events.finish,
                type: (o.type || null)
            });
            // tack on some custom data
            thisSound._data = {
                oLink: o, // DOM node for reference within SM2 object event handlers
                className: self.css.sPlaying
            };
            self.soundsByURL[soundURL] = thisSound;
            self.sounds.push(thisSound);
            thisSound.play();
        }

        self.lastSound = thisSound; // reference for next call

        if (typeof e != 'undefined' && typeof e.preventDefault != 'undefined') {
            e.preventDefault();
        } else {
            event.returnValue = false;
        }
        console.log('Sound played!');
        return false;
    }

    this.stopSound = function(oSound) {
        soundManager.stop(oSound.id);
        soundManager.unload(oSound.id);
    }
		
		this.leftArrowPressed = function() {
				console.log('left arrow pressed');
        var column_index = parseInt(self.curr_focus.attr('id')[1],10);
        console.log('Column index: ' + column_index);
        if (column_index !== 0) {
            self.curr_focus = $('#C' + (--column_index) + 'R' + self.curr_focus.attr('id')[3]);
            self.curr_focus.focus();
            /*if (table.display) {
                $('#focus').html(self.curr_focus.html());
            }*/
            return false;
        } else {
            return true;
        }
    };

    this.rightArrowPressed = function() {
    		console.log('right arrow pressed');
        var column_index = parseInt(self.curr_focus.attr('id')[1],10);
        console.log('Column index: ' + column_index);
        if (column_index !== self.table.dimensions.cols) {
            self.curr_focus = $('#C' + (++column_index) + 'R' + self.curr_focus.attr('id')[3]);
            self.curr_focus.focus();
            /*if (table.display) {
                $('#focus').html(self.curr_focus.html());
            }*/
            return false;
        } else {
            return true;
        }
    };

    this.downArrowPressed = function() {
    		console.log('down arrow pressed');
        var row_index = parseInt(self.curr_focus.attr('id')[3],10);
        if (row_index !== self.table.dimensions.rows) {
            //var new_id = self.curr_focus.attr('id').slice(0, 3) + (++row_index);
            self.curr_focus = $('#' + self.curr_focus.attr('id').slice(0, 3) + (++row_index) );
            self.curr_focus.focus();
            /*if (table.display) {
                $('#focus').html(self.curr_focus.html());
            }*/
            return false;
        } else {
            return true;
        }
    };

    this.upArrowPressed = function() {
    		console.log('up arrow pressed');
        var row_index = parseInt(self.curr_focus.attr('id')[3],10);
        if ((row_index === 1 && self.table.transposed) || (row_index === 0 && !self.table.transposed)) {
            return true;
        } else {
            //var new_id = self.curr_focus.attr('id').slice(0, 3) + (--row_index);
            self.curr_focus = $('#' + self.curr_focus.attr('id').slice(0, 3) + (--row_index) );
            self.curr_focus.focus();
            /*if (table.display) {
                $('#focus').html(self.curr_focus.html());
            }*/
            return false;
        }
    };
    
    this.setPanning = function() {
    	var panning;
	    if (self.table.isStereo){
	    	var col_index = parseInt(self.curr_focus.attr('id')[1], 10);
	    	switch ( col_index ) {
	    		case 0:
	    			panning = 0;
	    			break;
	    		case 1:
	    			panning = -100;
	    			break;
	    		case 2:
	    			panning = -50;
	    			break;
	    		case 3:
	    			panning = 0;
	    			break;
	    		case 4:
	    			panning = 50;
	    			break;
	    		case 5:
	    			panning = 100;
	    			break;
	    		default:
	    			console.warn('Panning is broken!');
	    	}
	    	return panning;
	    } else {
	    	return 0;
	    }
    };
		
    this.init = function() {
    		self.curr_focus = $('#C0R1');
    		self.curr_focus.focus();
    		
    		// Keystroke handling with keyStroke jQuery plug-in
    		$.keyStroke(37, self.leftArrowPressed);
    		$.keyStroke(38, self.upArrowPressed);
    		$.keyStroke(39, self.rightArrowPressed);
    		$.keyStroke(40, self.downArrowPressed);
    		
        sm._writeDebug('inlinePlayer.init()');
        // var oLinks = document.getElementsByTagName('a');
        var oLinks = $('a');
        // grab all links, look for .mp3
        var foundItems = 0;
        for (var i = 0, j = oLinks.length; i < j; i++) {
            if ((sm.canPlayLink(oLinks[i]) || self.classContains(oLinks[i], self.playableClass)) && !self.classContains(oLinks[i], self.excludeClass)) {
                self.addClass(oLinks[i], self.css.sDefault); // add default CSS decoration
                self.links[foundItems] = (oLinks[i]);
                self.indexByURL[oLinks[i].href] = foundItems; // hack for indexing
                foundItems++;
            }
        }
        if (foundItems > 0) {
            self.addEventHandler($(document), 'keydown', self.handleKeystroke);
            if (self.config.autoPlay) {
                self.handleKeystroke({
                    target: self.links[0],
                    preventDefault: function() {}
                });
            }
        }
        sm._writeDebug('inlinePlayer.init(): Found ' + foundItems + ' relevant items.');
    }

    this.init();

}

var inlinePlayer = null;

soundManager.setup(
	{
    // disable or enable debug output
    debugMode: true,
    // use HTML5 audio for MP3/MP4, if available
    preferFlash: true,
    useFlashBlock: true,
    // path to directory containing SM2 SWF
    url: '../swf/',
    // optional: enable MPEG-4/AAC support (requires flash 9)
    flashVersion: 9
	}
);

// ----

soundManager.onready(function() {
    // soundManager.createSound() etc. may now be called
    inlinePlayer = new InlinePlayer();
});