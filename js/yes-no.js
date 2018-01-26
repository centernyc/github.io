(function(global) {
    'use strict';

    // convenience variables
    var defaultCol = '#eee',
        activeCol = '#7AC143';

    var noYesBtns = function(_selection, label) {

        global.noYesBtns = noYesBtns;

        var instance = {};

        var dispatcher = d3.dispatch("_click");

        // some default values
        var nTxt = 'off', // text for NO button
            yTxt = 'on', // text for YES button
            nBg = defaultCol, // unselected background for NO
            yBg = defaultCol, // unselected bg for YES
            nBgActive = activeCol, // selected bg for NO
            yBgActive = activeCol; // selected bg for YES

        instance.render = function() {

            var container = d3.select(_selection);

            container.append('span')
              .attr('class', 'ny-label')
              .html(label);

            var btn = function(txt, bg, bgActive) {
                container.append('button')
                    .attr('class', 'ny-btn')
                    .text(txt)
                    .on('click', function () {
                        var on = d3.select(this).classed("ny-btn-active");
                        d3.select(this)
                            .html(on ? 'off' : 'on')
                            .classed("ny-btn-active", on ? false : true);

                        dispatcher.call("_click", this);
                    });
            };

            var ny = btn(nTxt, nBg, nBgActive);

            return instance;
        };

        instance.on = function() {
            var value = dispatcher.on.apply(dispatcher, arguments);
            return value === dispatcher ? instance : value;
        }

        // d3.rebind(instance, dispatch, 'on');
        return instance;
    };

    // allow access out ot IIFE
    global.noYesBtns = noYesBtns;

}(window));
