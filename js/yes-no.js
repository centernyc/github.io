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
                    .attr('class', 'ny-btn' + (txt == 'on' ? ' ny-btn-unselected' : ' ny-btn-selected'))
                    .style('background', txt == 'on' ? bg : bgActive)
                    .text(txt)
                    .on('click', function () {
                        d3.select(_selection).selectAll('.ny-btn')
                            .style('background', bg)
                            .classed('ny-btn-unselected', true)
                            .classed('ny-btn-selected', false);

                        d3.select(this)
                            .style('background', bgActive)
                            .classed('ny-btn-unselected', false)
                            .classed('ny-btn-selected', true);

                        dispatcher.call("_click", this);
                    });
            };

            var n = btn(nTxt, nBg, nBgActive);
            var y = btn(yTxt, yBg, yBgActive);

            return instance;
        };

        instance.on = function() {
            var value = dispatcher.on.apply(dispatcher, arguments);
            return value === dispatcher ? instance : value;
        }

        instance.nBg = function(value) {
            if (!arguments.length) return nBg;
            nBg = value;
            return this;
        };
        instance.yBg = function(value) {
            if (!arguments.length) return yBg;
            yBg = value;
            return this;
        };
        instance.nBgActive = function(value) {
            if (!arguments.length) return nBgActive;
            nBgActive = value;
            return this;
        };
        instance.yBgActive = function(value) {
            if (!arguments.length) return yBgActive;
            yBgActive = value;
            return this;
        };
        instance.nTxt = function(value) {
            if (!arguments.length) return nTxt;
            nTxt = value;
            return this;
        };
        instance.yTxt = function(value) {
            if (!arguments.length) return yTxt;
            yTxt = value;
            return this;
        };

        // d3.rebind(instance, dispatch, 'on');
        return instance;
    };

    // allow access out ot IIFE
    global.noYesBtns = noYesBtns;

}(window));
