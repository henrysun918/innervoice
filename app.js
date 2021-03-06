// ==================== App ====================
IV = (function() {
    function init() {
        IV.Constants.init();
        IV.Service.init();
        IV.View.init();
        IV.Router.init();
    }

    return {
        init: init
    }
}.call({}));

// ==================== Constants ====================
IV.Constants = (function() {
    var Classes = {
	    animate: "animate",
        playerOverlayContainer: "player-overlay-container",
        hidden: "hidden",
        active: "active",
        rightOverflowHide: "right-overflow-hide",
        fadeIn: "fade-in",
        fadeOut: "fade-out",
        duration3s: "duration-3s",
        duration1s: "duration-1s",
        clickThrough: "click-through"
    }

    var IDs = {
        launch: "launch",
        showMenu: "show-menu",
        hideMenu: "hide-menu",
        dropdown: "dropdown",
        subscribe: "subscribe",
        generalMode: "general-mode",
        subscribeMode: "subscribe-mode",
        contentBanner: "content-banner",
        contentIFrame: "content-iframe",
        contentTitle: "content-title",
        contentIntro: "content-intro",
        showPlayer: "show-player",
        loadedPlayer: "loaded-player",
        restartIntro: "restart-intro"
    }

    var Routes = {
        landing: "landing",
        player: "player",
        issueQuery: "i"
    }

    var Texts = {
        titlePrefix: "Issue No."
    }

    var landingAnimationDelay = 1500;
    var animateStepLength = 1500;

    function init() {
    }

    return {
        init: init,
        get Classes() { return Classes; },
        get IDs() { return IDs; },
        get animateStepLength() { return animateStepLength; },
        get Routes() { return Routes; },
        get Texts() { return Texts; },
        get landingAnimationDelay() { return landingAnimationDelay; }
    }
}.call({}));

// ==================== Service ====================
IV.Service = (function() {
    var playlists;
    var currentIssueNumber;

    function init() {
        loadData();
    }

    function loadData() {
        playlists = Data.playlists;
        currentIssueNumber = Data.currentIssueNumber;
    }

    function getIssueNumber() {
        var customIssue = parseInt(getQueryParameter(IV.Constants.Routes.issueQuery));
        var issueNumber = customIssue > 0 ? customIssue : currentIssueNumber;
        return issueNumber;
    }

    function getContentTitle() {
        var targetIssueNumber = getIssueNumber();
        var targetPlaylist = getPlaylistByIssueNumber(targetIssueNumber);
        return targetPlaylist.title;
    }

    function getContentIntro() {
        var targetIssueNumber = getIssueNumber();
        var targetPlaylist = getPlaylistByIssueNumber(targetIssueNumber);
        return targetPlaylist.intro;
    }

    function getIFrameURL() {
        var targetIssueNumber = getIssueNumber();
        var targetPlaylist = getPlaylistByIssueNumber(targetIssueNumber);
        return targetPlaylist.embedUrl;
    }

    function getPlaylistByIssueNumber(issueNumber) {
        issueNumber = issueNumber.toString();
        for(var i = 0, l = playlists.length; i < l; i++) {
            if (playlists[i].issueNumber === issueNumber)
                return playlists[i];
        }
    }

    function getQueryParameter(query) {
        var url = window.location.href;
        query = query.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + query + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    return {
        init: init,
        playlists: playlists,
        getIssueNumber: getIssueNumber,
        getContentTitle: getContentTitle,
        getContentIntro: getContentIntro,
        getIFrameURL: getIFrameURL
    };
}.call({}));

// ==================== Router ====================
IV.Router = (function() {
    var routes = {
        verify: {
            hash: "#verify",
            onEnter: onEnterVerifyView,
            onExit: onExitVerifyView
        },
        confirm: {
            hash: "#confirm",
            onEnter: onEnterConfirmView,
            onExit: onExitConfirmView
        },
        player: {
            hash: "#player",
            onEnter: onEnterPlayerView,
            onExit: onExitPlayerView 
        },
        landing: {
            hash: "#landing",
            onEnter: onEnterLandingView,
            onExit: onExitLandingView 
        }
    }
    function init() {
        window.onload = onEnterLandingView;
        window.onhashchange =  onHashChange;
        onHashChange();
    }

    function onHashChange() {
        switch (location.hash) {
            case routes.verify.hash:
                onExitAllBut('verify');
                routes.verify.onEnter();
                break;
            case routes.confirm.hash:
                onExitAllBut('confirm');
                routes.confirm.onEnter();
                break;
            case routes.player.hash:
                onExitAllBut('player');
                routes.player.onEnter();
                break;
            case routes.landing.hash:
            case '':
                onExitAllBut('landing');
                routes.landing.onEnter();
                break;
        }
    }

    function onExitAllBut(routeName) {
        for(var route in routes) {
            if(routeName !== route) {
                routes[route].onExit();
            }
        }
    }

    function onEnterConfirmView() {}
    function onExitConfirmView() {}
    function onEnterVerifyView() {}
    function onExitVerifyView() {}

    function onEnterLandingView() {
        IV.View.animateLandingPage();
    }

    function onExitLandingView() {
        IV.View.landingViewReset();
    }

    function onEnterPlayerView() {
        IV.View.animatePlayerPageLoading();
    }

    function onExitPlayerView() {
        IV.View.hideMenu();
        IV.View.playerViewReset();
    }

    function navigateToPlayerView() {
        window.location.hash = IV.Constants.Routes.player;
    }

    function navigateToLandingView() {
        window.location.hash = IV.Constants.Routes.landing;
    }

    return {
        init: init,
        navigateToPlayerView: navigateToPlayerView
    };
}.call({}));

// ==================== View ====================
IV.View = (function() {
    var Buttons = {};
    var ToggleViews = {};
    var MenuModes = {};
    var DynamicContent = {};
    var animateTimers = [];
    var landingAnimationDelayTimer;

    function init() {
        fetchElements();
        hydrateTemplates();
        bindInteractions();
     }

    function fetchElements() {
        Buttons.launch = document.getElementById(IV.Constants.IDs.launch);
        Buttons.showMenu = document.getElementById(IV.Constants.IDs.showMenu);
        Buttons.hideMenu = document.getElementById(IV.Constants.IDs.hideMenu);
        Buttons.restartIntro = document.getElementById(IV.Constants.IDs.restartIntro);
        Buttons.subscribe = document.getElementById(IV.Constants.IDs.subscribe);
        Buttons.showPlayer = document.getElementById(IV.Constants.IDs.showPlayer);
        ToggleViews.dropdown = document.getElementById(IV.Constants.IDs.dropdown);
        ToggleViews.contentBanner = document.getElementById(IV.Constants.IDs.contentBanner);
        ToggleViews.loadedPlayer = document.getElementById(IV.Constants.IDs.loadedPlayer);
        MenuModes.generalMode = document.getElementById(IV.Constants.IDs.generalMode);
        MenuModes.subscribeMode = document.getElementById(IV.Constants.IDs.subscribeMode);
        DynamicContent.contentIFrame = document.getElementById(IV.Constants.IDs.contentIFrame);
        DynamicContent.contentTitle = document.getElementById(IV.Constants.IDs.contentTitle);
        DynamicContent.contentIntro = document.getElementById(IV.Constants.IDs.contentIntro);
    }

    function hydrateTemplates() {
        setIFrameURL();
        setTitle();
        setIntro();
    }

    function bindInteractions() {
        Buttons.launch.onclick = IV.Router.navigateToPlayerView;
        Buttons.showMenu.onclick = showMenu;
        Buttons.hideMenu.onclick = hideMenu;
        Buttons.subscribe.onclick = animateMenuToSubscribeMode;
        Buttons.showPlayer.onclick = animatePlayerPageLoaded;
        Buttons.restartIntro.onclick = restartIntro;
    }

    function showMenu() {
        ToggleViews.dropdown.classList.add(IV.Constants.Classes.active);
        Buttons.showMenu.classList.add(IV.Constants.Classes.hidden);
        hideBanner();
    }

    function hideMenu() {
        ToggleViews.dropdown.classList.remove(IV.Constants.Classes.active);
        Buttons.showMenu.classList.remove(IV.Constants.Classes.hidden);
        switchMenuToMode(MenuModes.generalMode, false);
    }

    function showBanner() {
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.hidden);
    }

    function hideBanner() {
        ToggleViews.contentBanner.classList.add(IV.Constants.Classes.hidden);
    }

    function setTitle() {
        DynamicContent.contentTitle.textContent = IV.Constants.Texts.titlePrefix + IV.Service.getIssueNumber() + ' – ' + IV.Service.getContentTitle();
    }

    function setIntro() {
        DynamicContent.contentIntro.textContent = IV.Service.getContentIntro();
    }

    function setIFrameURL() {
        DynamicContent.contentIFrame.src = IV.Service.getIFrameURL();
    }

    function animateMenuToSubscribeMode() {
        switchMenuToMode(MenuModes.subscribeMode)
    }

    function switchMenuToMode(targetMode, animate) {
        // Pre-ECMA5 default value
        animate = typeof animate !== 'undefined' ? animate : true;

        for(var menuMode in MenuModes) {
            if (targetMode !== MenuModes[menuMode])
                // hide other modes
                MenuModes[menuMode].classList.add(IV.Constants.Classes.hidden);
                MenuModes[menuMode].classList.remove(IV.Constants.Classes.rightOverflowHide);
                MenuModes[menuMode].classList.remove(IV.Constants.Classes.active);
        }

        // show selected mode
        targetMode.classList.remove(IV.Constants.Classes.hidden);
        
        // optional animation
        if (animate) {
            targetMode.classList.add(IV.Constants.Classes.rightOverflowHide);
            targetMode.classList.add(IV.Constants.Classes.active);
        }
    }

    function animatePlayerPageLoading() {
        ToggleViews.contentBanner.classList.add(IV.Constants.Classes.animate);
    }

    function animatePlayerPageLoaded() {
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.animate);
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.fadeIn);
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.duration3s);
        ToggleViews.contentBanner.classList.add(IV.Constants.Classes.clickThrough);
        ToggleViews.contentBanner.classList.add(IV.Constants.Classes.duration1s);
        ToggleViews.contentBanner.classList.add(IV.Constants.Classes.fadeOut);
        window.setTimeout(function() {
            ToggleViews.contentBanner.classList.add(IV.Constants.Classes.animate);
            ToggleViews.loadedPlayer.classList.remove(IV.Constants.Classes.hidden);
            ToggleViews.loadedPlayer.classList.add(IV.Constants.Classes.animate);
        }, 10);
    }

    function playerViewReset() {
        hideMenu();
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.hidden);
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.animate);
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.fadeOut);
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.duration1s);
        ToggleViews.contentBanner.classList.remove(IV.Constants.Classes.clickThrough);
        ToggleViews.contentBanner.classList.add(IV.Constants.Classes.duration3s);
        ToggleViews.contentBanner.classList.add(IV.Constants.Classes.fadeIn);
        ToggleViews.loadedPlayer.classList.remove(IV.Constants.Classes.animate);
        ToggleViews.loadedPlayer.classList.add(IV.Constants.Classes.hidden);
    }

    function restartIntro() {
        playerViewReset();
        window.setTimeout(function() {
            animatePlayerPageLoading();
        }, 10);
    }

    function animateLandingPage() {
        landingAnimationDelayTimer = setTimeout(function() {
            recursiveAnimate(1, 2);
        }, IV.Constants.landingAnimationDelay);
        
    }

    function landingViewReset() {
        for(var i = 0, l = animateTimers.length; i < l; i++) {
            animateTimers[i]();
        }
        animateTimers = [];
        clearTimeout(landingAnimationDelayTimer);
    }

    function recursiveAnimate(delay, maxDelay) {
        (function() {    
            var timer = setTimeout(function() {
                var element = document.getElementsByClassName("animate-onload-" + delay);
                for(var i = 0, l = element.length; i < l; i++) {
                    element[i].classList.add(IV.Constants.Classes.animate);
                }

                if (delay < maxDelay)
                    recursiveAnimate(delay + 1, maxDelay);

            }, IV.Constants.animateStepLength);

            var destroyCallback = function() {
                clearTimeout(timer);
                var element = document.getElementsByClassName("animate-onload-" + delay);
                for(var i = 0, l = element.length; i < l; i++) {
                    element[i].classList.remove(IV.Constants.Classes.animate);
                }
            }
            animateTimers.push(destroyCallback);            
        })();
    }

    return {
        init: init,
        animateLandingPage: animateLandingPage,
        landingViewReset: landingViewReset,
        animatePlayerPageLoading: animatePlayerPageLoading,
        playerViewReset: playerViewReset,
        hideMenu: hideMenu
    };
}.call({}));

// ==================== Bootstrap ====================
IV.init();