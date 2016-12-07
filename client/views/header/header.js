Template.header.helpers({
    isHome:function() {
        return Router.current().route.getName() == "home" ? true : false;
    }
});