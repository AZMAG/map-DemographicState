/**
 * Demographic report window
 *
 * @class demographic-vm
 */

(function() {

    "use strict";

    define([
            "dojo/dom-construct",
            "dojo/dom",
            "dojo/topic",
            "dojo/_base/array",
            "dojo/on",
            "dojo/text!app/views/demographic-view.html",
            "dojo/text!app/views/selectedCensusFeaturesTabPage-view.html",
            "dojo/text!app/views/selectedACSFeaturesTabPage-view.html",
            "dojo/text!app/views/demographicChartHelp-view.html",
            "dojo/text!app/views/demographicSummaryHelp-view.html",
            "dojo/text!app/views/demographicSelFeaturesHelp-view.html",
            "dojo/text!app/views/ACSDemographicChartHelp-view.html",
            "dojo/text!app/views/ACSDemographicSummaryHelp-view.html",
            "dojo/text!app/views/ACSDemographicSelFeaturesHelp-view.html",
            "app/vm/help-vm",
            "dojo/text!app/views/alert1-view.html",
            "dojo/text!app/views/alert2-view.html",
            "app/vm/alert1-vm",
            "app/vm/alert2-vm",
            "app/helpers/layer-delegate",
            "app/helpers/printMap-delegate",
            "app/helpers/magNumberFormatter",
            "app/models/map-model",
            "app/config/demographicConfig",
            "app/config/acsFieldsConfig",
            "app/config/censusFieldsConfig",
            "esri/graphicsUtils",
            "esri/symbols/SimpleLineSymbol",
            "esri/symbols/SimpleFillSymbol",
            "dojo/_base/Color"
        ],
        function(dc, dom, tp, da, on, view, selCensusFeatsView, selACSFeatsView, chartHelpView, summaryHelpView,
            selFeatHelpView, ACSChartHelpView, ACSSummaryHelpView, ACSSelFeatHelpView, helpVM, alertView1, alertView2, alert1VM, alert2VM, layerDelegate, printMapDelegate,
            magNumberFormatter, mapModel, demographicConfig, acsFieldsConfig, censusFieldsConfig, graphicsUtils) {

            var DemographicVM = new function() {

                /**
                 * Store reference to module this object.
                 *
                 * @property self
                 * @type {*}
                 */
                var self = this;

                /**
                 * Open state of the Kendo window.
                 *
                 * @property windowIsOpen
                 * @type {boolean}
                 */
                var windowIsOpen = false;

                /**
                 * Redraw the default chart when the window first opens.
                 *
                 * @property redrawChart
                 * @type {boolean}
                 */
                var redrawChart = false;

                /**
                 * Name of the county for County Summary
                 *
                 * @property county
                 * @type {string}
                 */
                // vern change - moved to 2 county map
                //var county = "Maricopa County";

                /**
                 * Current community name.
                 * Used for display and to determine functionality.
                 *
                 * @property communityName
                 * @type {string}
                 */
                self.communityName = "";

                /**
                 * Base title for the window.
                 *
                 * @property windowTitle
                 * @type {string}
                 */
                self.windowTitle = "Report Results for ";

                /**
                 * Current report configuration object.
                 *
                 * @property reportConfigItem
                 * @type {Object}
                 */
                self.reportConfigItem = {};


                self.selectionGraphic = "";

                self.reportType = "";

                /**
                 * Array of aggregate values based on the current report configuration object.
                 *
                 * @property aggCensusValuesArray
                 * @type {Array}
                 */
                self.aggCensusValuesArray = [];

                /**
                 * Array of aggregate values based on the current report configuration object.
                 *
                 * @property aggACSValuesArray
                 * @type {Array}
                 */
                self.aggACSValuesArray = [];

                /**
                 * Object containing agg values grouped by chart categories.
                 *
                 * @property aggValuesCensusGroupedByChartCategory
                 * @type {Object}
                 */
                self.aggValuesCensusGroupedByChartCategory = {};

                /**
                 * Object containing agg values grouped by chart categories.
                 *
                 * @property aggValuesACSGroupedByChartCategory
                 * @type {Object}
                 */
                self.aggValuesACSGroupedByChartCategory = {};

                /**
                 * Object containing agg values grouped by field categories.
                 *
                 * @property aggValuesGroupedByFieldCategory
                 * @type {Object}
                 */
                self.aggValuesGroupedByFieldCategory = {};

                /**
                 * Array of chart categories for list view.
                 *
                 * @property chartCategories
                 * @type {Array}
                 */
                self.chartCategories = [];

                /**
                 * Currently selected chart category.
                 *
                 * @property selectedCategoryObj
                 * @type {Object}
                 */
                self.selectedCategoryObj = undefined;

                /**
                 * Array of grouped agg values for the currently selected chart category.
                 *
                 * @property groupedItems
                 * @type {undefined}
                 */
                self.groupedItems = undefined;

                self.pyramidData = undefined;

                /**
                 * Keep track of chart legend visibility
                 *
                 * @property legendCensusVisible
                 * @type {boolean}
                 */
                self.legendCensusVisible = false;

                /**
                 * Keep track of chart legend visibility
                 *
                 * @property legendACSVisible
                 * @type {boolean}
                 */
                self.legendACSVisible = false;


                /**
                 * Name of compare to community.
                 *
                 * @property compareToName
                 * @type {string}
                 */
                self.compareToName = "";

                /**
                 * Keep track of whether or not there are selected features.
                 *
                 * @property hasSelectedFeatures
                 * @type {boolean}
                 */
                self.hasSelectedFeatures = false;

                /**
                 * Currently selected features.
                 *
                 * @property selectedFeatures
                 * @type {null}
                 */
                self.selectedFeatures = null;

                /**
                 * Array of feature attributes for display in the grid.
                 *
                 * @property featureAttributeArray
                 * @type {Array}
                 */
                self.featureAttributeArray = [];

                self.totalFemale = 0;
                self.totalMale = 0;

                /**
                 * Feature used for comparison values.
                 *
                 * @property compareFeature
                 * @type {null}
                 */
                self.compareFeature = null;

                // used to size window for mobile. vw
                self.winWidth = document.documentElement.clientWidth;
                self.winHeight = document.documentElement.clientHeight;

                if (self.winWidth <= 668) {
                    self.newWindowWidth = "600px";
                    self.newWindowHeight = "300px";
                } else if (self.winWidth <= 800) {
                    self.newWindowWidth = "630px";
                    self.newWindowHeight = "auto";
                } else if (self.winWidth <= 1024) {
                    self.newWindowWidth = "630px";
                    self.newWindowHeight = "auto";
                } else if (self.winWidth <= 1200) {
                    self.newWindowWidth = "630px";
                    self.newWindowHeight = "auto";
                } else {
                    self.newWindowWidth = "630px";
                    self.newWindowHeight = "auto";
                }

                /**
                 * Initialize the class.
                 *
                 * @method init
                 */
                self.init = function() {
                    // Place the HTML from the view into the main application after the map div.
                    dc.place(view, "mapContainer", "after");

                    // Create the Kendo Window
                    var chartWindow = $("#demographicView").kendoWindow({
                        width: self.newWindowWidth, // "630px"
                        height: self.newWindowHeight, // "auto"
                        title: self.windowTitle,
                        actions: ["Help", "Minimize", "Close"],
                        modal: false,
                        visible: false,
                        resizable: false,
                        close: self.windowClosed
                    }).data("kendoWindow");

                    // Initial window placement
                    $("#demographicView").closest(".k-window").css({
                        top: 70,
                        left: (self.winWidth / 2) - 300
                    });

                    // Display legend checkbox click event
                    $("#displayACSLegend").bind("click", function() {
                        self.legendACSVisible = this.checked;
                        if (self.selectedCategoryObj !== undefined && self.groupedItems !== undefined) {
                            var kendoChart = $("#demACSChartArea").data("kendoChart");
                            if (kendoChart !== undefined) {
                                kendoChart.destroy();
                                kendoChart.element.remove();
                            } else {
                                $("#demACSChartArea").remove();
                            }
                            self.createChart("ACS");
                            self.reloadChart();
                        }
                    });

                    // Display legend checkbox click event
                    $("#displayCensusLegend").bind("click", function() {
                        self.legendCensusVisible = this.checked;

                        if (self.selectedCategoryObj !== undefined && self.groupedItems !== undefined) {
                            var kendoChart = $("#demCensusChartArea").data("kendoChart");
                            if (kendoChart !== undefined) {
                                kendoChart.destroy();
                                kendoChart.element.remove();
                            } else {
                                $("#demACSChartArea").remove();
                            }
                            self.createChart("census");
                            self.reloadChart();
                        }
                    });

                    // Use Compare checkbox click event
                    $("#demCensusUseComp").bind("click", self.useCompareClicked);

                    // Use Compare checkbox click event
                    $("#demACSUseComp").bind("click", self.useCompareClicked);

                    // Set up summary export types
                    $("#demExportSummary").kendoDropDownList({
                        index: 0,
                        dataSource: {
                            data: ["Excel", "CSV"]
                        }
                    });

                    // Get the help button and assign the click event.
                    var helpButton = chartWindow.wrapper.find(".k-i-help");
                    helpButton.click(function() {
                        var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                        var tab = tabStrip.select();

                        if (tab[0].textContent === "ACS 2014 Charts") {
                            helpVM.openWindow(ACSChartHelpView);
                        } else if (tab[0].textContent === "Census 2010 Charts") {
                            helpVM.openWindow(chartHelpView);
                        } else if (tab[0].textContent === "ACS 2014 Data") {
                            helpVM.openWindow(ACSSummaryHelpView);
                        } else if (tab[0].textContent === "Census 2010 Data") {
                            helpVM.openWindow(summaryHelpView);
                        } else if (tab[0].textContent === "ACS Block Groups") {
                            helpVM.openWindow(ACSSelFeatHelpView);
                        } else if (tab[0].textContent === "Census Block Groups") {
                            helpVM.openWindow(SelFeatHelpView);
                        }
                    });

                    /**
                     * Used to set the popup property for the summary report
                     */
                    tp.subscribe("summaryLinkClick", function() {
                        self.openSummaryLink();
                    });

                }; // end Init
                //****************************************************************
                /**
                 * Fired when the window closes
                 *
                 * @event close
                 * @param e - event arguments.
                 */
                self.windowClosed = function() {
                    windowIsOpen = false;
                    redrawChart = false;
                    mapModel.clearGraphics();

                    if (self.hasSelectedFeatures) {
                        self.selectedFeatures = null;
                        self.hasSelectedFeatures = false;
                        mapModel.clearGraphics();


                        var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                        if (tabStrip !== undefined && tabStrip !== null) {
                            var firstTab = tabStrip.tabGroup.children("li:first");
                            if (firstTab[0].textContent === "Selected Block Groups") {
                                tabStrip.remove(0);
                                tabStrip.select(1);
                            }
                        }
                    }

                    //remove combobox on closing.
                    var compareComboBoxInput = $("#demCompareComboBox");
                    var compareComboBoxObj = compareComboBoxInput.data("kendoComboBox");

                    if (compareComboBoxObj) {
                        compareComboBoxObj.destroy();
                        compareComboBoxObj.wrapper.remove();
                    }
                };

                /**
                 * Opens the popup link "View Summary" for each layer specified
                 * @return {[type]} [description]
                 */
                self.openSummaryLink = function() {
                    var county = dom.byId("countyLink");
                    var congress = dom.byId("congressionalLink");
                    var legislative = dom.byId("legislativeLink");
                    var zipCode = dom.byId("zipCodeLink");
                    var cogs = dom.byId("cogLink");

                    if (county) {
                        self.openWindow(county.innerHTML, "county");
                    }
                    if (congress) {
                        self.openWindow(congress.innerHTML, "congressional");
                    }
                    if (legislative) {
                        self.openWindow(legislative.innerHTML, "legislative");
                    }
                    if (zipCode) {
                        self.openWindow(zipCode.innerHTML, "zipCode");
                    }
                    if (cogs) {
                        self.openWindow(cogs.innerHTML, "cog");
                    }
                };

                /**
                 * Open the window and initialize the contents.
                 *
                 * @method openWindow
                 * @param {string} communityName - name of the community for the report.
                 * @param {string} sumName - name of the config for the report type. vw
                 */
                self.openWindow = function(communityName, sumName) {

                    self.hasSelectedFeatures = false;
                    self.commChanged = (self.communityName !== undefined && self.communityName !== "" && self.communityName !== communityName);
                    self.communityName = communityName;
                    self.compareToName = "";
                    self.compareFeature = null;
                    self.reportType = sumName;

                    self.updateSelectionGraphic();
                    //$("#demSource").html(appConfig.sourceLabel);

                    // Set the summary report config item
                    switch (sumName) {
                        case "state":
                            self.reportConfigItem = demographicConfig.reports.stateSummary;
                            break;
                        case "county":
                            self.reportConfigItem = demographicConfig.reports.countySummary;
                            break;
                        case "legislative":
                            self.reportConfigItem = demographicConfig.reports.legislativeSummary;
                            break;
                        case "congressional":
                            self.reportConfigItem = demographicConfig.reports.congressionalSummary;
                            break;
                        case "place":
                            self.reportConfigItem = demographicConfig.reports.placeSummary;
                            break;
                        case "zipCode":
                            self.reportConfigItem = demographicConfig.reports.zipCodeSummary;
                            break;
                        case "cog":
                            self.reportConfigItem = demographicConfig.reports.cogSummary;
                            $("#demSource").html("Source: United States Census Bureau, American Community Survey 2010-2014 5yr Estimates (Interpolation Used, See help for more details) ");
                            break;
                    }

                    // Get the window and open it.
                    var win = $("#demographicView").data("kendoWindow");
                    win.title(self.windowTitle + communityName);
                    if (!windowIsOpen) {
                        win.restore();
                        // win.center();
                        redrawChart = true;
                    }
                    win.restore();
                    // win.center();
                    win.open();
                    windowIsOpen = true;

                    //reset compare combo boxes
                    //Get instance of each dropdown to see if they are there
                    self.resetComparisonDropdowns();

                    // Initial window placement
                    $("#demographicView").closest(".k-window").css({
                        top: 70,
                        left: (self.winWidth / 2) - 300
                    });

                    // Create the Kendo tab strip
                    var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                    if (tabStrip === undefined) {
                        tabStrip = $("#demTabStrip").kendoTabStrip({
                            activate: self.tabActivated,
                            scrollable: false
                        });
                    } else {
                        tabStrip.select(0);
                        tabStrip.trigger("activate");
                    }

                    // Create the splitter
                    var splitter = $("#demSplitContainer").data("kendoSplitter");
                    if (splitter === undefined) {
                        $("#demSplitContainer").kendoSplitter({
                            panes: [{
                                collapsible: false,
                                resizable: false
                            }, {
                                collapsible: false,
                                resizable: false,
                                size: "30%"
                            }]
                        });
                    }

                    self.getData();

                    if (redrawChart) {
                        setTimeout(function() {
                            var chart = $("#demChartArea").data("kendoChart");
                            if (chart) {
                                chart.redraw();
                            }
                        }, 500);
                        redrawChart = false;
                    }

                };

                /**
                 * Callback method for interactive/query errors.
                 *
                 * @method interactiveSelectionQueryFault
                 * @param {Error} error - error object
                 */
                self.interactiveSelectionQueryFault = function(error) {
                    console.log(error.message);
                };

                /**
                 * Callback method for interactive/query results.
                 *
                 * @method interactiveSelectionQueryHandler
                 * @param {FeatureSet} results - feature set returned by query.
                 */
                self.interactiveSelectionQueryHandler = function(results) {
                    self.selectedFeatures = results.features;

                    // counts number of selected block groups. vw
                    var num = queryCountGlobal;
                    var numFeatures = magNumberFormatter.formatValue(num);

                    // test for results. vw
                    if (num === 0) {
                        // Get the alert window and open it. vw
                        alert2VM.openWindow(alertView2);
                        esri.hide(dom.byId("loading"));
                        return;
                    }

                    var type = "census";
                    if (Object.keys(results.features[0].attributes).length > 120) {
                        type = "acs";
                    }

                    self.hasSelectedFeatures = true;

                    // Add the graphics
                    mapModel.addGraphics(self.selectedFeatures, undefined, true);

                    // Perform actions similar to the openWindow method
                    var communityName = "Selected Block Groups";
                    self.commChanged = true;
                    //(self.communityName !== undefined && self.communityName !== "" && self.communityName !== communityName);
                    self.communityName = communityName;
                    self.reportConfigItem = demographicConfig.reports.censusTracts;

                    // Get the window and open it.
                    var win = $("#demographicView").data("kendoWindow");
                    win.title(self.windowTitle + communityName);
                    if (!windowIsOpen) {
                        win.restore();
                        win.center();
                        redrawChart = true;
                    }
                    win.restore();
                    win.center();
                    win.open();
                    windowIsOpen = true;

                    self.resetComparisonDropdowns();

                    // hide loading gif when window opens. vw
                    esri.hide(dom.byId("loading"));

                    // enables the infoWindow after interactive summary selection is done.
                    mapModel.showInfoWindow();

                    // Set the source
                    $("#demSource").text("Source: " + self.reportConfigItem.source);

                    // Create the Kendo tab strip
                    var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                    if (tabStrip === undefined) {
                        $("#demTabStrip").kendoTabStrip({
                            activate: self.tabActivated,
                            scrollable: false
                        });
                    }
                    tabStrip = $("#demTabStrip").data("kendoTabStrip");
                    var firstTab;
                    if (tabStrip !== undefined && tabStrip !== null) {

                        var tabStripList = tabStrip.items();
                        firstTab = tabStripList[0].textContent;
                        var secondTab = tabStripList[1].textContent;

                        if (firstTab === "Census Block Groups" && secondTab === "ACS Block Groups") {
                            tabStrip.remove(0);
                            tabStrip.remove(0);
                            tabStrip.select(0);
                        }
                    }

                    // Create the splitter
                    var splitter = $("#demSplitContainer").data("kendoSplitter");
                    if (splitter === undefined) {
                        $("#demSplitContainer").kendoSplitter({
                            panes: [{
                                collapsible: false,
                                resizable: false
                            }, {
                                collapsible: false,
                                resizable: false,
                                size: "30%"
                            }]
                        });
                    }
                    var tabName, tabContent, optionsRow, gridName, exportButton, countLabel, columnConfig;
                    // We already have the data, so handle it.
                    if (type === "census") {
                        self.censusDataQueryHandler(results);
                        tabName = "Census Block Groups";
                        tabContent = selCensusFeatsView;
                        optionsRow = "demCensusSelFeatOptionsRow";
                        gridName = "demCensusFeatGrid";
                        exportButton = "demCensusExportSelFeatResults";
                        countLabel = "fCensusCount";
                        columnConfig = demographicConfig.selectedCensusBlockGroups;

                    } else {
                        self.acsDataQueryHandler(results);
                        tabName = "ACS Block Groups";
                        tabContent = selACSFeatsView;
                        optionsRow = "demACSSelFeatOptionsRow";
                        gridName = "demACSFeatGrid";
                        exportButton = "demACSExportSelFeatResults";
                        countLabel = "fACSCount";
                        columnConfig = demographicConfig.selectedACSBlockGroups;
                    }

                    // Create the feature attribute array
                    self.featureAttributeArray = [];
                    $.each(self.selectedFeatures, function(index, feature) {
                        self.featureAttributeArray.push(feature.attributes);
                    });

                    // Check to see if the tab is already present
                    firstTab = tabStrip.tabGroup.children("li:first");

                    if (firstTab[0].textContent !== tabName) {
                        // Add the Selected Block Groups tab
                        tabStrip.insertBefore({
                            text: tabName,
                            content: tabContent
                        }, tabStrip.tabGroup.children("li:first"));
                    }

                    // add feature count span to selected block groups tab. vw
                    //
                    dom.byId(countLabel).innerHTML = numFeatures;


                    // Make sure grid doesn't already exist
                    var kendoGrid = $("#" + gridName).data("kendoGrid");
                    if (kendoGrid !== undefined && kendoGrid !== null) {
                        kendoGrid.element.remove();
                        kendoGrid.destroy();
                    }

                    // Add the grid
                    dc.create("div", {
                        id: gridName,
                        style: "margin: 5px 0 0 0; font-size: small;"
                    }, optionsRow, "after");

                    // grid for Selected Block Groups Tab vw
                    // Kendo-ize the grid
                    $("#" + gridName).kendoGrid({
                        dataSource: {
                            data: self.featureAttributeArray
                        },
                        selectable: true,
                        sortable: true,
                        scrollable: true,
                        resizable: false,
                        columnMenu: false,
                        columns: columnConfig,
                        dataBound: self.gridRowHover
                    });

                    // Size the grid
                    self.sizeGrid("#" + gridName);

                    // Bind the export button
                    $("#" + exportButton).bind("click", self.exportToExcel);

                    // Reload the chart to update to current data

                    var tab = tabStrip.select();
                    if (tab.length > 0) {
                        if (tab[0].textContent === "ACS 2014 Charts" || tab[0].textContent === "Census 2010 Charts") {
                            self.reloadChart();
                        }
                    }

                    if (redrawChart) {
                        setTimeout(function() {
                            var chart = $("#demChartArea").data("kendoChart");
                            if (chart) {
                                chart.redraw();
                            }
                        }, 1500);
                        redrawChart = false;
                    }
                };

                /**
                 * Creates the hover effect on the grid and highlights the related graphic.
                 *
                 * @method gridRowHover
                 */
                self.gridRowHover = function() {
                    $(".k-grid table tbody tr").hover(
                        function() {
                            var thisObj = $(this);

                            // Highlight the row
                            thisObj.toggleClass("k-state-hover");

                            // Highlight the graphic
                            var objectId = thisObj[0].childNodes[0].innerHTML;
                            var objID = Number(objectId);
                            // console.log(mapModel.getGraphics().graphics);
                            $.each(mapModel.getGraphics().graphics, function(index, graphic) {
                                if (graphic.attributes === undefined) {
                                    // do nothing!!
                                } else {
                                    if (graphic.attributes.OBJECTID === objID) {
                                        var color = "cyan";
                                        if (thisObj.hasClass("k-state-hover")) {
                                            color = "yellow";
                                        }
                                        mapModel.setSymbol(graphic, color);
                                    }
                                }
                            });
                        }
                    );
                };

                /**
                 * Fires when a tab is activated.
                 *
                 * @event activate
                 * @param e - event arguments
                 */
                self.tabActivated = function() {
                    var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                    var tab = tabStrip.select();
                    var chartListDivObj = $("#demCensusChartList");

                    if (tab[0]) {
                        if (self.reportType == 'cog') {
                            //Sets the correct source label at bottom of report
                            if (tab[0].textContent === "Census 2010 Charts" || tab[0].textContent === "Census 2010 Data") {
                                $("#demSource").html("Source: United States Census Bureau, 2010 Decennial Census (Interpolation used, see help for more details.) ");
                            } else {
                                $("#demSource").html("Source: United States Census Bureau, American Community Survey 2010-2014 5yr Estimates (Interpolation used, see help for more details.) ");
                            }
                        } else {
                            //Sets the correct source label at bottom of report
                            if (tab[0].textContent === "Census 2010 Charts" || tab[0].textContent === "Census 2010 Data") {
                                $("#demSource").html(appConfig.sourceLabel2);
                            } else {
                                $("#demSource").html(appConfig.sourceLabel);
                            }
                        }
                        // Reload the chart to ensure it is up-to-date
                        if (tab[0].textContent === "Census 2010 Charts" || tab[0].textContent === "ACS 2014 Charts") {
                            self.reloadChart();
                        }
                    }
                };

                /**
                 * Call the layer delegate to query the appropriate map service for the current community.
                 *
                 * @method getData
                 */
                self.getData = function() {
                    var url = self.reportConfigItem.censusRestUrl;
                    var url2 = self.reportConfigItem.ACSRestUrl;
                    var whereClause = self.reportConfigItem.summaryField + " = '" + self.communityName + "'";
                    layerDelegate.query(url, self.censusDataQueryHandler, self.dataQueryFault, null, whereClause, true);
                    layerDelegate.query(url2, self.acsDataQueryHandler, self.dataQueryFault, null, whereClause, true);
                };

                /**
                 * Callback method for query errors from getData method.
                 *
                 * @method dataQueryFault
                 * @param {Error} error - error object
                 */
                self.dataQueryFault = function(error) {
                    console.log(error.message);
                };

                /**
                 * Callback method for query results from getData method.
                 * @param {FeatureSet} results - feature set returned by query.
                 */
                self.censusDataQueryHandler = function(results) {
                    var features = results.features;
                    var isACS = false;
                    var fieldCount = Object.keys(features[0].attributes).length;
                    var fields = censusFieldsConfig.fields;
                    var chartListDivObj = $("#demCensusChartList");
                    var gridName = "#demCensusDataGrid";
                    var compareName = "demCensusUseComp";
                    var gridType = "census";
                    var featuresCount = features.length;

                    // Clear the current graphics
                    mapModel.clearGraphics();

                    var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                    if (tabStrip !== undefined && tabStrip !== null) {

                        var tabStripList = tabStrip.items();
                        var firstTab = tabStripList[0].textContent;
                        var secondTab = tabStripList[1].textContent;

                        if (firstTab === "ACS Block Groups" && secondTab === "Census Block Groups") {
                            tabStrip.remove(0);
                            tabStrip.remove(0);
                            tabStrip.select(0);
                        }
                    }
                    self.resetComparisonDropdowns();

                    // Summarize the features
                    var sumAttributes = self.summarizeAttributes(features);

                    // Get the configuration
                    var aggValues = {};
                    $.each(fields, function(index, field) {
                        var attribute = sumAttributes[field.fieldName];
                        var attrValue = Number(attribute);

                        if (field.canSum === true || featuresCount === 1) {
                            aggValues[field.fieldName] = {
                                fieldCategory: field.category,
                                fieldGroup: field.groupID, // added to sort order in data grid. vw
                                fieldRowSort: field.rowID, // added to sort row order in data grid. vw
                                fieldName: field.fieldName,
                                tableHeader: field.tableHeader,
                                fieldType: field.fieldType,
                                fieldAlias: field.fieldAlias,
                                fieldClass: field.class,
                                fieldValue: attrValue,
                                fieldValueFormatted: magNumberFormatter.formatValue(attrValue),
                                chartCategory: field.chartCategory,
                                chartType: field.chartType,
                                chartName: field.chartCategory, // added to give name to series for legend. vw
                                timePeriod: field.timePeriod,
                                derivedTargetField: field.fieldName,
                                derivedPercentOfField: field.percentOfField,
                                percentValue: 0,
                                percentValueFormatted: "0",
                                derivedDensityAreaField: field.densityAreaField,
                                densityValue: 0,
                                densityValueFormatted: "0"
                            };

                            // checks for NaN in the data and blanks out field. vw
                            if (isNaN(attrValue)) {
                                aggValues[field.fieldName].fieldValue = "-";
                                aggValues[field.fieldName].fieldValueFormatted = "-";
                            }
                            if (field.percentOfField === "" || field.percentOfField === undefined) {
                                aggValues[field.fieldName].percentValueFormatted = "-";
                            } else if (field.percentOfField !== undefined) {
                                var percentOf = Number(sumAttributes[field.percentOfField]);
                                aggValues[field.fieldName].percentValue = (attrValue / percentOf) * 100;
                                aggValues[field.fieldName].percentValueFormatted = magNumberFormatter.formatValue((attrValue / percentOf) * 100) + "%";
                                if (aggValues[field.fieldName].percentValueFormatted.indexOf(".") > -1 && aggValues[field.fieldName].percentValueFormatted.length === 3) {
                                    aggValues[field.fieldName].percentValueFormatted = "0" + aggValues[field.fieldName].percentValueFormatted;
                                }
                            }
                            if (field.densityAreaField !== "") {
                                var densityArea = Number(sumAttributes[field.densityAreaField]);
                                aggValues[field.fieldName].densityValue = attrValue / densityArea;
                                aggValues[field.fieldName].densityValueFormatted = magNumberFormatter.formatValue(attrValue / densityArea);
                            }
                        }
                    });
                    //
                    // Filter and group for chart categories
                    self.chartCategories = [];
                    self.aggCensusValuesArray = [];
                    self.aggValuesCensusGroupedByChartCategory = {};
                    self.aggValuesGroupedByFieldCategory = {};
                    $.each(aggValues, function(index, item) {
                        self.aggCensusValuesArray.push(aggValues[item.fieldName]);
                        // Chart Categories
                        if (item.chartCategory !== "") {
                            if (item.chartCategory in self.aggValuesCensusGroupedByChartCategory) {
                                self.aggValuesCensusGroupedByChartCategory[item.chartCategory].push(aggValues[item.fieldName]);
                            } else {
                                self.chartCategories.push({
                                    chartCategory: item.chartCategory
                                });
                                self.aggValuesCensusGroupedByChartCategory[item.chartCategory] = [aggValues[item.fieldName]];
                            }
                        }

                        // Field Categories
                        if (item.fieldCategory !== "") {
                            if (item.fieldCategory in self.aggValuesGroupedByFieldCategory) {
                                self.aggValuesGroupedByFieldCategory[item.fieldCategory].push(aggValues[item.fieldName]);
                            } else {
                                self.aggValuesGroupedByFieldCategory[item.fieldCategory] = [aggValues[item.fieldName]];
                            }
                        }
                    });

                    if (self.compareFeature !== null) {
                        self.addCompareValues("census");
                    }

                    var kendoListView = chartListDivObj.data("kendoListView");

                    if (kendoListView === undefined || kendoListView === null) {
                        chartListDivObj.kendoListView({
                            dataSource: {
                                data: self.chartCategories
                            },
                            selectable: "single",
                            change: self.onChartListSelectionChanged,
                            template: kendo.template($("#demChartListTemplate").html())
                        });

                        // Select the first item
                        var listView = chartListDivObj.data("kendoListView");
                        listView.select(listView.element.children().first());
                    }

                    // Reset comparison if community has changed
                    if (self.commChanged) {
                        // Clear the comparison checkbox
                        $("#demCensusUseComp").prop("checked", false);

                        // Reload the chart if on the charts tab
                        var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                        var tab = tabStrip.select();
                        if (tab[0].textContent === "Census 2010 Charts") {
                            self.reloadChart();
                        }

                        // Reload the comparison places
                        self.reloadCompareComboBox();
                    }

                    // Create the summary grid
                    var kendoGrid = $(gridName).data("kendoGrid");
                    if (kendoGrid !== null) {
                        kendoGrid.element.remove();
                        kendoGrid.destroy();
                    }

                    var useCompare = dom.byId(compareName).checked;
                    if (useCompare) {
                        self.createKendoGridWithCompare(gridType);
                    } else {
                        self.createKendoGrid(gridType);
                    }
                };

                self.updateSelectionGraphic = function(selectionGraphic) {
                    if (selectionGraphic) {
                        self.selectionGraphic = selectionGraphic;
                    } else {
                        self.selectionGraphic = "";
                    }
                };

                /**
                 * Callback method for query results from getData method.
                 * @param {FeatureSet} results - feature set returned by query.
                 */
                self.acsDataQueryHandler = function(results) {

                    var features = results.features;
                    var isACS = false;
                    var fieldCount = Object.keys(features[0].attributes).length;
                    var fields = acsFieldsConfig.fields;
                    var chartListDivObj = $("#demACSChartList");
                    var gridName = "#demACSDataGrid";
                    var compareName = "demACSUseComp";
                    var gridType = "ACS";
                    var featuresCount = features.length;

                    // Clear the current graphics
                    mapModel.clearGraphics();

                    // Add the new graphics. vw
                    if (features[0].geometry !== null) {
                        mapModel.addGraphics(features, undefined, true);
                        if (($("#demInteractiveDiv").is(":visible") === false) || $("#zoomSelection").prop("checked")) {
                            // Zoom to selected graphics. vw
                            var zoomExtent = graphicsUtils.graphicsExtent(features);
                            mapModel.setMapExtent(zoomExtent);
                        }
                    }
                    self.resetComparisonDropdowns();

                    // Summarize the features
                    var sumAttributes = self.summarizeAttributes(features);

                    // Get the configuration
                    var aggValues = {};
                    $.each(fields, function(index, field) {
                        var attribute = sumAttributes[field.fieldName];
                        var attrValue = Number(attribute);

                        if (field.canSum === true || featuresCount === 1) {
                            aggValues[field.fieldName] = {
                                fieldCategory: field.category,
                                fieldGroup: field.groupID, // added to sort order in data grid. vw
                                fieldRowSort: field.rowID, // added to sort row order in data grid. vw
                                fieldName: field.fieldName,
                                tableHeader: field.tableHeader,
                                fieldAlias: field.fieldAlias,
                                fieldType: field.fieldType,
                                fieldClass: field.class,
                                fieldValue: attrValue,
                                fieldValueFormatted: magNumberFormatter.formatValue(attrValue),
                                chartCategory: field.chartCategory,
                                chartType: field.chartType,
                                chartName: field.chartCategory, // added to give name to series for legend. vw
                                parentField: field.parentField,
                                timePeriod: field.timePeriod,
                                percentOfField: field.percentOfField,
                                derivedTargetField: field.fieldName,
                                derivedPercentOfField: field.percentOfField,
                                percentValue: 0,
                                percentValueFormatted: "0",
                                derivedDensityAreaField: field.densityAreaField,
                                densityValue: 0,
                                densityValueFormatted: "0"
                            };

                            // checks for NaN in the data and blanks out field. vw
                            if (isNaN(attrValue)) {
                                aggValues[field.fieldName].fieldValue = "-";
                                aggValues[field.fieldName].fieldValueFormatted = "-";
                            }
                            if (field.percentOfField === "" || field.percentOfField === undefined) {
                                aggValues[field.fieldName].percentValueFormatted = "-";
                            } else if (field.percentOfField !== undefined) {
                                var percentOf = Number(sumAttributes[field.percentOfField]);
                                aggValues[field.fieldName].percentValue = (attrValue / percentOf) * 100;
                                aggValues[field.fieldName].percentValueFormatted = magNumberFormatter.formatValue((attrValue / percentOf) * 100) + "%";
                                if (aggValues[field.fieldName].percentValueFormatted.indexOf(".") > -1 && aggValues[field.fieldName].percentValueFormatted.length === 3) {
                                    aggValues[field.fieldName].percentValueFormatted = "0" + aggValues[field.fieldName].percentValueFormatted;
                                }

                            }
                            if (field.densityAreaField !== "" || field.densityAreaField !== undefined) {
                                var densityArea = Number(sumAttributes[field.densityAreaField]);
                                aggValues[field.fieldName].densityValue = attrValue / densityArea;
                                aggValues[field.fieldName].densityValueFormatted = magNumberFormatter.formatValue(attrValue / densityArea);
                            }

                            if (aggValues[field.fieldName].percentValueFormatted === "NaN%") {
                                aggValues[field.fieldName].percentValueFormatted = "-";
                            }
                        }
                    });
                    //
                    // Filter and group for chart categories
                    self.chartCategories = [];
                    self.aggACSValuesArray = [];
                    self.aggValuesACSGroupedByChartCategory = {};
                    self.aggValuesGroupedByFieldCategory = {};
                    $.each(aggValues, function(index, item) {
                        self.aggACSValuesArray.push(aggValues[item.fieldName]);
                        // Chart Categories
                        if (item.chartCategory !== "") {
                            if (item.chartCategory in self.aggValuesACSGroupedByChartCategory) {
                                self.aggValuesACSGroupedByChartCategory[item.chartCategory].push(aggValues[item.fieldName]);
                            } else {
                                self.chartCategories.push({
                                    chartCategory: item.chartCategory
                                });
                                self.aggValuesACSGroupedByChartCategory[item.chartCategory] = [aggValues[item.fieldName]];
                            }
                        }

                        // Field Categories
                        if (item.fieldCategory !== "") {
                            if (item.fieldCategory in self.aggValuesGroupedByFieldCategory) {
                                self.aggValuesGroupedByFieldCategory[item.fieldCategory].push(aggValues[item.fieldName]);
                            } else {
                                self.aggValuesGroupedByFieldCategory[item.fieldCategory] = [aggValues[item.fieldName]];
                            }
                        }
                    });

                    if (self.compareFeature !== null) {
                        self.addCompareValues("acs");
                    }

                    var kendoListView = chartListDivObj.data("kendoListView");

                    if (kendoListView === undefined || kendoListView === null) {
                        chartListDivObj.kendoListView({
                            dataSource: {
                                data: self.chartCategories
                            },
                            selectable: "single",
                            change: self.onChartListSelectionChanged,
                            template: kendo.template($("#demChartListTemplate").html())
                        });

                        // Select the first item
                        var listView = chartListDivObj.data("kendoListView");
                        listView.select(listView.element.children().first());
                    }

                    // Reset comparison if community has changed
                    if (self.commChanged) {
                        // Clear the comparison checkbox
                        $("#demACSUseComp").prop("checked", false);
                        $("#demCensusUseComp").prop("checked", false);

                        // Reload the chart if on the charts tab
                        var tabStrip = $("#demTabStrip").data("kendoTabStrip");
                        var tab = tabStrip.select();
                        if (tab[0].textContent === "Census 2010 Charts" || tab[0].textContent === "ACS 2014 Charts") {
                            self.reloadChart();
                        }

                        // Reload the comparison places
                        self.reloadCompareComboBox();
                    }

                    // Create the summary grid
                    var kendoGrid = $(gridName).data("kendoGrid");
                    if (kendoGrid !== null) {
                        kendoGrid.element.remove();
                        kendoGrid.destroy();
                    }

                    var useCompare = dom.byId(compareName).checked;
                    if (useCompare) {
                        self.createKendoGridWithCompare(gridType);
                    } else {
                        self.createKendoGrid(gridType);
                    }

                    if (self.selectionGraphic !== "") {
                        mapModel.addGraphic(self.selectionGraphic, undefined, true, true);
                    }

                };

                /**
                 * Initiate query for contents of comparison combo box.
                 *
                 * @method reloadCompareComboBox
                 */
                self.reloadCompareComboBox = function(type) {
                    var compareComboBoxInput = $("#demCompareComboBox");
                    var compareComboBoxObj = compareComboBoxInput.data("kendoComboBox");

                    if (compareComboBoxObj !== undefined && compareComboBoxObj !== null) {
                        compareComboBoxObj.enable(false);

                        // Get the place names
                        var url = self.reportConfigItem.compareACSUrl;
                        var whereClause = self.reportConfigItem.compareWhereClause;
                        var outFields = self.reportConfigItem.comparePlaceField;
                        layerDelegate.query(url, self.placeListQueryHandler, self.placeListQueryFault, null, whereClause, false, [outFields], [outFields], true);
                    }
                };



                /**
                 * Totals all of the attributes and returns them in an array
                 *
                 * @param features - returned array of features from esri query
                 */
                self.summarizeAttributes = function(features) {
                    // Summarize the features
                    var sumAttributes = {};
                    $.each(features, function(index, feature) {
                        for (var attribute in feature.attributes) {
                            if (attribute in sumAttributes) {
                                var val = sumAttributes[attribute];
                                sumAttributes[attribute] = val + feature.attributes[attribute];
                            } else {
                                var newVal = feature.attributes[attribute];
                                if ($.isNumeric(newVal)) {
                                    sumAttributes[attribute] = newVal;
                                }
                            }
                        }
                    });
                    return sumAttributes;
                };

                /**
                 * Fired when user clicks the comparison check box.
                 *
                 * @event click
                 * @param e - event arguments
                 */
                self.useCompareClicked = function(sender) {
                    var compareComboBoxInput = $("#demCensusCompareComboBox");
                    var compareComboBoxObj = compareComboBoxInput.data("kendoComboBox");
                    var kendoGrid = $("#demCensusDataGrid").data("kendoGrid");
                    var type = "census";
                    var handler = self.placeCensusListQueryHandler;
                    var url = self.reportConfigItem.compareCensusUrl;

                    if (sender.target.id === "demACSUseComp") {
                        // Toggle the compare combobox
                        compareComboBoxInput = $("#demACSCompareComboBox");
                        compareComboBoxObj = compareComboBoxInput.data("kendoComboBox");
                        kendoGrid = $("#demACSDataGrid").data("kendoGrid");
                        handler = self.placeACSListQueryHandler;
                        type = "ACS";
                        url = self.reportConfigItem.compareACSUrl;
                    }
                    if (compareComboBoxObj === undefined || compareComboBoxObj === null) {
                        // Get the place names
                        var whereClause = self.reportConfigItem.compareWhereClause;
                        var outFields = self.reportConfigItem.comparePlaceField;
                        layerDelegate.query(url, handler, self.placeListQueryFault, null, whereClause, false, [outFields], null, true);
                    } else {
                        if ($(this).is(":checked")) {
                            compareComboBoxObj.enable(true);
                            var selectedIndex = compareComboBoxObj.select();
                            if (selectedIndex > 0) {
                                // Update the Grid

                                if (kendoGrid !== undefined) {
                                    kendoGrid.element.remove();
                                    kendoGrid.destroy();
                                }
                                self.createKendoGridWithCompare(type);
                            }
                        } else {
                            compareComboBoxObj.enable(false);
                            self.compareFeature = null;

                            // this block removes from the dom vw
                            compareComboBoxObj.destroy();
                            compareComboBoxObj.wrapper.remove();

                            // Update the Grid
                            if (kendoGrid !== undefined) {
                                kendoGrid.element.remove();
                                kendoGrid.destroy();
                            }
                            self.createKendoGrid(type);
                        }
                    }
                };

                /**
                 * Callback method for errors returned by place query.
                 *
                 * @method placeListQueryFault
                 * @param {Error} error - error object
                 */
                self.placeListQueryFault = function(error) {
                    console.log(error.message);
                };

                /**
                 * Callback method for results returned by place query.
                 * @param {FeatureSet} results - feature set returned by query.
                 */
                self.placeCensusListQueryHandler = function(results) {
                    var features = results.features;

                    // Create array of names
                    var placeField = self.reportConfigItem.comparePlaceField;
                    var nameArray = [];
                    nameArray.push({
                        Name: " Compare with..."
                    });
                    $.each(features, function(index, feature) {
                        var name = feature.attributes[placeField];
                        nameArray.push({
                            Name: name
                        });
                    });

                    // used to sort attributes and put into Array. vw
                    function compare(a, b) {
                        if (a.Name < b.Name) {
                            return -1;
                        }
                        if (a.Name > b.Name) {
                            return 1;
                        }
                        return 0;
                    }
                    nameArray.sort(compare);

                    var compareComboBoxInput = $("#demCensusCompareComboBox");
                    var compareComboBoxObj = compareComboBoxInput.data("kendoComboBox");

                    if (compareComboBoxObj) {
                        compareComboBoxObj.destroy();
                        compareComboBoxObj.wrapper.remove();
                    }
                    dc.create("input", {
                        id: "demCensusCompareComboBox"
                    }, "demCensusUseCompLabel", "after");
                    $("#demCensusCompareComboBox").kendoComboBox({
                        index: 0,
                        dataTextField: "Name",
                        dataValueField: "Name",
                        filter: "contains",
                        dataSource: {
                            data: nameArray
                        },
                        select: self.compareNameSelected
                    });
                    //}
                };

                /**
                 * Callback method for results returned by place query.
                 * @param {FeatureSet} results - feature set returned by query.
                 */
                self.placeACSListQueryHandler = function(results) {
                    var features = results.features;

                    // Create array of names
                    var placeField = self.reportConfigItem.comparePlaceField;
                    var nameArray = [];
                    nameArray.push({
                        Name: " Compare with..."
                    });
                    $.each(features, function(index, feature) {
                        var name = feature.attributes[placeField];
                        nameArray.push({
                            Name: name
                        });
                    });

                    // used to sort attributes and put into Array. vw
                    function compare(a, b) {
                        if (a.Name < b.Name) {
                            return -1;
                        }
                        if (a.Name > b.Name) {
                            return 1;
                        }
                        return 0;
                    }
                    nameArray.sort(compare);

                    var compareComboBoxInput = $("#demACSCompareComboBox");
                    var compareComboBoxObj = compareComboBoxInput.data("kendoComboBox");

                    if (compareComboBoxObj) {
                        compareComboBoxObj.destroy();
                        compareComboBoxObj.wrapper.remove();
                    }
                    dc.create("input", {
                        id: "demACSCompareComboBox"
                    }, "demACSUseCompLabel", "after");
                    $("#demACSCompareComboBox").kendoComboBox({
                        index: 0,
                        dataTextField: "Name",
                        dataValueField: "Name",
                        filter: "contains",
                        dataSource: {
                            data: nameArray
                        },
                        select: self.compareNameSelected
                    });
                    //}
                };

                /**
                 * Fired when users selects a comparison name from the combo box.
                 *
                 * @event select
                 * @param e - event arguments
                 */
                self.compareNameSelected = function(e) {

                    var senderID = e.sender.element.prop("id");
                    var handler = self.placeCensusQueryHelper;
                    var type = "census";
                    var gridID = "#demCensusDataGrid";
                    var url = self.reportConfigItem.compareCensusUrl;

                    if (senderID === "demACSCompareComboBox") {
                        handler = self.placeACSQueryHelper;
                        type = "ACS";
                        gridID = "#demACSDataGrid";
                        url = self.reportConfigItem.compareACSUrl;
                    }

                    if (e.item.text() !== " Compare with...") {
                        var selectedName = this.dataItem(e.item.index());
                        self.compareToName = selectedName.Name;
                        var whereClause = self.reportConfigItem.comparePlaceField + " = '" + self.compareToName + "'";
                        layerDelegate.query(url, handler, self.placeQueryFault, null, whereClause, true);
                    }
                };

                /**
                 * Callback method for errors returned by place comparison query.
                 *
                 * @method placeQueryFault
                 * @param {Error} error - error object
                 */
                self.placeQueryFault = function(error) {
                    console.log(error.message);
                };

                /**
                 * Callback method for results returned by place comparison query.
                 *
                 * @method placeCensusQueryHelper
                 * @param {FeatureSet} results - feature set returned by query.
                 */
                self.placeCensusQueryHelper = function(results) {
                    var features = results.features;
                    self.compareFeature = features[0]; // There should only be one feature returned from query

                    self.addCompareValues("census");

                    // Update the Grid
                    var kendoGrid = $("#demCensusDataGrid").data("kendoGrid");
                    if (kendoGrid !== undefined) {
                        kendoGrid.element.remove();
                        kendoGrid.destroy();
                    }
                    self.createKendoGridWithCompare("census");
                };

                /**
                 * Callback method for results returned by place comparison query.
                 *
                 * @method placeQueryHelper
                 * @param {FeatureSet} results - feature set returned by query.
                 */
                self.placeACSQueryHelper = function(results) {
                    var features = results.features;
                    self.compareFeature = features[0]; // There should only be one feature returned from query

                    self.addCompareValues("ACS");

                    // Update the Grid
                    var kendoGrid = $("#demACSDataGrid").data("kendoGrid");
                    if (kendoGrid !== undefined) {
                        kendoGrid.element.remove();
                        kendoGrid.destroy();
                    }
                    self.createKendoGridWithCompare("ACS");
                };



                /**
                 * Add the comparison values to the aggregated values of the current community or Selected Block Groups.
                 *
                 * @method addCompareValues
                 */
                self.addCompareValues = function(type) {
                    if (self.compareFeature === null) {
                        return;
                    }

                    var dataSource = self.aggACSValuesArray;

                    if (type === "census") {
                        dataSource = self.aggCensusValuesArray;
                    }

                    // Iterate through existing values to add the comparison properties
                    $.each(dataSource, function(index, item) {

                        var fieldValue = self.compareFeature.attributes[item.fieldName];
                        item.compareValue = fieldValue;
                        item.compareValueFormatted = magNumberFormatter.formatValue(fieldValue);
                        item.comparePercentValue = 0;
                        item.comparePercentValueFormatted = "0";
                        item.compareDensityValue = 0;
                        item.compareDensityValueFormatted = "0";

                        if (item.derivedTargetField !== undefined && item.derivedTargetField !== null && item.derivedTargetField !== "") {
                            var curTarget = self.compareFeature.attributes[item.derivedTargetField];

                            // checks for "0" in data to return null. vw added?
                            if (item.derivedPercentOfField === "" || item.derivedPercentOfField === undefined) {
                                item.comparePercentValueFormatted = "-";
                            }
                            if (item.derivedPercentOfField !== "" && item.derivedPercentOfField !== undefined) {
                                var percentOf = Number(self.compareFeature.attributes[item.derivedPercentOfField]);
                                var value = item.compareValue;
                                item.comparePercentValue = (value / percentOf) * 100;
                                if (item.comparePercentValue !== null && !isNaN(item.comparePercentValue) && item.comparePercentValue !== Infinity) {
                                    item.comparePercentValueFormatted = magNumberFormatter.formatValue(item.comparePercentValue) + "%";
                                } else {
                                    item.comparePercentValueFormatted = "-";
                                }
                            }

                            if (item.derivedDensityAreaField !== undefined && item.derivedDensityAreaField !== null && item.derivedDensityAreaField !== "") {
                                var densityArea = Number(self.compareFeature.attributes[item.derivedDensityAreaField]);
                                var densityValue = (curTarget / densityArea);
                                item.compareDensityValue = densityValue;
                                if (!isNaN(densityValue)) {
                                    item.compareDensityValueFormatted = magNumberFormatter.formatValue(densityValue);
                                }
                            }
                        }
                    });
                };



                /**
                 * Fired when user selects an item in the chart category list view
                 *
                 * @event change
                 * @param e - event arguments
                 */
                self.onChartListSelectionChanged = function() {
                    self.selectedCategoryObj = this.select();
                    self.groupedItems = self.aggValuesCensusGroupedByChartCategory[self.selectedCategoryObj[0].childNodes[1].innerHTML];

                    if (self.groupedItems === undefined) {
                        self.groupedItems = self.aggValuesACSGroupedByChartCategory[self.selectedCategoryObj[0].childNodes[1].innerHTML];
                    }

                    // Update the chart
                    var censusChartAreaSelector = $("#demCensusChartArea");

                    var kendoChart1 = censusChartAreaSelector.data("kendoChart");
                    if (kendoChart1 !== null && kendoChart1 !== undefined) {
                        kendoChart1.destroy();
                        kendoChart1.element.remove();
                        self.createChart("census");
                    } else {
                        censusChartAreaSelector.remove();
                        self.createChart("census");
                    }

                    var kendoChart2 = $("#demACSChartArea").data("kendoChart");
                    var d3Chart = $("#demACSChartArea");

                    if (kendoChart2 !== null && kendoChart2 !== undefined) {
                        kendoChart2.destroy();
                        kendoChart2.element.remove();
                        self.createChart("ACS");
                    } else if (d3Chart !== null && d3Chart !== undefined) {
                        d3Chart.remove();
                        self.createChart("ACS");
                    } else {
                        self.createChart("ACS");
                    }

                };

                /**
                 * Reload the current chart.
                 *
                 * @method reloadChart
                 */
                self.reloadChart = function() {
                    var chartListDivObj1 = $("#demCensusChartList");
                    var kendoListView1 = chartListDivObj1.data("kendoListView");

                    var chartListDivObj2 = $("#demACSChartList");
                    var kendoListView2 = chartListDivObj2.data("kendoListView");

                    if (kendoListView1 !== undefined && kendoListView1 !== null) {
                        self.selectedCategoryObj = kendoListView1.select();
                        self.groupedItems = self.aggValuesCensusGroupedByChartCategory[self.selectedCategoryObj[0].childNodes[1].innerHTML];

                        // Update the chart
                        var kendoChart = $("#demCensusChartArea").data("kendoChart");
                        if (kendoChart !== null && kendoChart !== undefined) {
                            kendoChart.destroy();
                            kendoChart.element.remove();
                        } else {
                            $("#demCensusChartArea").remove();
                        }
                        self.createChart("census");
                    }

                    if (kendoListView2 !== undefined && kendoListView2 !== null) {
                        self.selectedCategoryObj = kendoListView2.select();

                        self.groupedItems = self.aggValuesACSGroupedByChartCategory[self.selectedCategoryObj[0].childNodes[1].innerHTML];

                        // Update the chart
                        var kendoChart2 = $("#demACSChartArea").data("kendoChart");
                        var kendoChart3 = $("#demACSChartArea");

                        if (kendoChart2 !== null && kendoChart2 !== undefined) {
                            kendoChart2.destroy();
                            kendoChart2.element.remove();
                            self.createChart("ACS");
                        } else if (kendoChart3 !== null && kendoChart3 !== undefined) {
                            kendoChart3.remove();
                            self.createChart("ACS");
                        } else {
                            self.createChart("ACS");
                        }
                    }
                };

                /**
                 * Create Kendo chart.
                 * Uses self.groupedItems as dataSource
                 *
                 * @method createChart
                 */
                self.createChart = function(type) {
                    // Create the div element for the chart
                    var legendVisible = false;
                    var chartObj;
                    if (self.groupedItems === undefined) {

                        if (type === "census") {
                            var chartListDivObj = $("#demCensusChartList");
                            var kendoListView = chartListDivObj.data("kendoListView");
                            self.selectedCategoryObj = kendoListView.select();
                            self.groupedItems = self.aggValuesCensusGroupedByChartCategory[self.selectedCategoryObj[0].childNodes[1].innerHTML];
                            legendVisible = self.legendCensusVisible;
                        } else {
                            var chartListDivObj = $("#demACSChartList");
                            var kendoListView = chartListDivObj.data("kendoListView");
                            self.selectedCategoryObj = kendoListView.select();
                            self.groupedItems = self.aggValuesACSGroupedByChartCategory[self.selectedCategoryObj[0].childNodes[1].innerHTML];
                            legendVisible = self.legendACSVisible;
                        }
                    }

                    if (type === "census") {
                        dc.create("div", {
                            id: "demCensusChartArea"
                        }, "demCensusChartAreaPane", "first");
                        chartObj = $("#demCensusChartArea");
                        legendVisible = self.legendCensusVisible;

                    } else {
                        dc.create("div", {
                            id: "demACSChartArea"
                        }, "demACSChartAreaPane", "first");
                        chartObj = $("#demACSChartArea");
                        legendVisible = self.legendACSVisible;
                    }

                    // Set the height
                    chartObj.css({
                        height: 300,
                        overflow: "hidden"
                    });

                    var categoryName = self.selectedCategoryObj[0].childNodes[1].innerHTML;

                    if (categoryName === "Occupation") {
                        self.createTreeMap();
                    } else if (categoryName === "Age By Gender") {
                        self.createAgePyramid();
                    } else {

                        var templateString = "#= category #<br>#= kendo.format('{0:P}', percentage) #<br>#= kendo.format('{0:N0}', value) #";
                        if (self.groupedItems[0].chartType !== "pie") {
                            templateString = "#= category #<br>#= kendo.format('{0:N0}', value) #";
                        }

                        var series1 = [];
                        var filteredItems = [];

                        $.each(self.groupedItems, function(i, item) {
                            //filtering out zero values
                            if (item.fieldValue !== 0) {
                                filteredItems.push(item);
                            }
                            series1.push(item.fieldValue);
                        });

                        var largestValue = Math.max.apply(Math, series1);
                        var valueAxisTemplate = "#= kendo.format(\'{0:N0}\', value)#";
                        var largeValue = false;
                        if (largestValue > 1000) {
                            if (largestValue > 5000) {
                                valueAxisTemplate = "#= kendo.format('{0:N0}', Math.abs(value) / 1000) #";
                            } else {
                                valueAxisTemplate = "#= kendo.format('{0:N1}', Math.abs(value) / 1000) #";
                            }
                            largeValue = true;
                        }

                        var showLabels = false;
                        if (self.groupedItems[0].chartType === "pie") {
                            showLabels = true;
                        }

                        if (filteredItems.length !== 0) {


                            // Kendo-ize
                            var chart = chartObj.kendoChart({
                                dataSource: {
                                    data: filteredItems
                                },

                                //change color of charts vw
                                seriesColors: appConfig.seriesColors,

                                legend: {
                                    visible: legendVisible,
                                    position: "bottom",
                                    // offsetX: 15,
                                    // offsetY: -80,
                                    margin: {
                                        left: 0,
                                        right: 10
                                    },
                                    labels: {
                                        color: "white"
                                    }
                                },
                                series: [{
                                    name: self.groupedItems[0].chartName,
                                    type: self.groupedItems[0].chartType,
                                    field: "fieldValue",
                                    categoryField: "fieldAlias",
                                    padding: 75
                                }],
                                seriesDefaults: {
                                    labels: {
                                        visible: showLabels,
                                        position: "outsideEnd",
                                        background: "#4D4D4D",
                                        format: "{0:n}",
                                        color: "white",
                                        // template: "#= category #"
                                        template: "#= category #"
                                    },
                                    tooltip: {
                                        visible: true,
                                        //background: "#4D4D4D",
                                        color: "black",
                                        // border: {
                                        //     width: 1,
                                        //     color: "white"
                                        // },
                                        // template: "#= kendo.format('{0:n0}', value) # - #= kendo.format('{0:P}', percentage) #"
                                        // template: "#= kendo.format('{0:P}', percentage) #"
                                        template: templateString
                                    }
                                },
                                plotArea: {
                                    margin: {
                                        right: 30,

                                    }
                                },
                                chartArea: {
                                    background: "#4D4D4D",
                                    margin: {
                                        left: 15,
                                        top: 5,
                                        right: 15
                                    }
                                },
                                categoryAxis: {
                                    //title: { text: "test"},
                                    field: "fieldAlias",
                                    color: "white",
                                    labels: {
                                        visible: true,
                                        rotation: 0
                                    },
                                    majorGridLines: {
                                        visible: false
                                    },
                                    line: {
                                        visible: false
                                    }
                                },
                                valueAxis: {
                                    //title: { text: "test"},
                                    color: "white",
                                    labels: {
                                        template: valueAxisTemplate
                                    },
                                    title: {
                                        text: "*Values shown in thousands",
                                        font: "10px Arial,Helvetica,sans-serif",
                                        visible: largeValue
                                    }
                                }
                            }).data("kendoChart");
                        } else {
                            chartObj.html("<span style='margin:30%;'>No data available for this chart.<span>");
                        }
                    }
                };

                /**
                 * This method is intended to dynamically resize the chart based on the size of it's parent and sibling contents.
                 * It was not working as expected, so it has been essentially reduced to setting a static height.
                 *
                 * @method sizeGrid
                 * @param {string} selector - id of the div element representing the grid.
                 */
                self.sizeGrid = function(selector) {
                    var gridElement = $(selector),
                        newHeight = 270,
                        otherElements = gridElement.children().not(".k-grid-content"),
                        otherElementsHeight = 0;

                    otherElements.each(function() {
                        otherElementsHeight += $(this).outerHeight();
                    });

                    if (otherElementsHeight < 28) {
                        otherElementsHeight = 28;
                    }

                    if (selector === "#demFeatGrid") {
                        newHeight = 250;
                    }

                    //console.log("newHeight: " + newHeight);
                    gridElement.children(".k-grid-content").height(newHeight); // - (otherElementsHeight - 28));     //newHeight - otherElementsHeight);
                };

                /**
                 * Create the Summary Report div element and Kendo-ize it as a Grid.
                 * Uses self.aggValuesArray as dataSource.
                 *
                 * @method createKendoGrid
                 */
                self.createKendoGrid = function(type) {

                    var dataGridName = "demACSDataGrid";
                    var demoOptionsRowName = "demACSSummaryOptionsRow";
                    var dataSource = self.aggACSValuesArray;

                    if (type === "census") {
                        dataGridName = "demCensusDataGrid";
                        demoOptionsRowName = "demCensusSummaryOptionsRow";
                        dataSource = self.aggCensusValuesArray;
                    }

                    $.each(dataSource, function(i, value) {
                        if (value["fieldType"] === "Currency") {
                            value["fieldValueFormatted"] = "$ " + magNumberFormatter.formatValue(value["fieldValue"]);

                        } else if (value["fieldType"] === "Rate") {
                            value["percentValueFormatted"] = magNumberFormatter.formatValue(value["fieldValue"]) + "%";
                            value["fieldValueFormatted"] = "-";
                        }
                    });


                    // Create the div element for the grid
                    dc.create("div", {
                        id: dataGridName,
                        style: "margin: 5px 0 0 0; font-size: small;"
                    }, demoOptionsRowName, "after");

                    // Kendo-ize
                    $("#" + dataGridName).kendoGrid({
                        dataSource: {
                            data: dataSource,
                            group: {
                                field: "fieldGroup"
                            },
                            sort: {
                                field: "fieldRowSort",
                                dir: "asc"
                            }
                        },
                        selectable: true,
                        scrollable: true,
                        sortable: false,
                        resizable: true,
                        columnMenu: false,
                        columns: [{
                                field: "fieldGroup",
                                title: "Category",
                                hidden: true,
                                groupHeaderTemplate: "#=value#"
                            }, {
                                field: "tableHeader",
                                title: " ",
                                width: "350px"
                            }, {
                                field: "fieldValueFormatted",
                                title: "Total",
                                format: "{0:n1}"
                            }, {
                                field: "percentValueFormatted",
                                title: "Percent"
                            },
                            //{field: "densityValueFormatted", title: "Per Sq Mile", format: "{0:n1}"}
                        ],
                        dataBound: function(e) {
                            if (this.wrapper[0].id !== "demCensusDataGrid") {
                                // get the index of the UnitsInStock cell
                                var rowCollection = e.sender.tbody[0].children;
                                var data = e.sender._data;
                                var realRows = [];

                                $.each(rowCollection, function(i, row) {
                                    if (row.className !== "k-grouping-row") {
                                        realRows.push(row);
                                    }
                                });
                                $.each(realRows, function(i, row) {
                                    if (data[i]) {
                                        if (data[i]["fieldCategory"] === "Occupation") {
                                            if (data[i].parentField === "" || data[i].fieldName === "ProtectiveServ") {
                                                var jRow = $(row);
                                                jRow.addClass("k-header");
                                                jRow.removeClass("k-alt");
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    });

                    self.sizeGrid("#" + dataGridName);
                };

                self.createTreeMap = function() {
                    var data = [];
                    var parents = [];
                    var items = [];
                    $("#demACSChartArea").addClass("bubbleChart");
                    $.each(self.groupedItems, function(i, item) {

                        var parentObj = {};

                        if (item.parentField !== "" && item.fieldAlias !== "Protective service occupations" && item.fieldValue !== 0) {
                            var strArray = item.fieldAlias.split(" ");
                            var text1 = "";
                            var text2 = "";
                            var text3 = "";

                            if (strArray.length < 4) {
                                for (i = 0; i < strArray.length; i++) {
                                    text1 += strArray[i] + " ";
                                }
                            } else if (strArray.length > 3 && strArray.length < 6) {
                                for (i = 0; i < 3; i++) {
                                    text1 += strArray[i] + " ";
                                }
                                for (i = 3; i < strArray.length; i++) {
                                    text2 += strArray[i] + " ";
                                }
                            } else {
                                for (i = 0; i < 3; i++) {
                                    text1 += strArray[i] + " ";
                                }
                                for (i = 3; i < 6; i++) {
                                    text2 += strArray[i] + " ";
                                }
                                text3 = "...";
                            }

                            var childObj = {
                                text: text1,
                                text2: text2,
                                text3: text3,
                                fullText: item.fieldAlias,
                                count: item.fieldValue.toString(),
                                label: item.fieldValue.toLocaleString(),
                                percent: item.percentValueFormatted,
                                category: item.parentField
                            };

                            items.push(childObj);
                        }
                    });

                    var bubbleChart = new d3.svg.BubbleChart({
                        supportResponsive: true,
                        //container: => use @default
                        size: 500,
                        viewBoxSize: 500,
                        innerRadius: 120,
                        //outerRadius: => use @default
                        radiusMin: 10,
                        radiusMax: 20,
                        //intersectDelta: 100,
                        intersectInc: 20,
                        circleColor: "category", //use @default
                        data: {
                            items: items,
                            eval: function(item) {
                                return item.count;
                            },
                            color: function(item) {
                                var color = "";
                                $.each(appConfig.bubbleColors, function(i, value) {
                                    //console.log(value.category);
                                    if (value.category === item.category) {
                                        color = value.color;
                                        return;
                                    }
                                });

                                //console.log(item.category)

                                return color;
                            },
                            classed: function(item) {
                                return item.text.split(" ").join("");
                            }
                        },
                        plugins: [{
                            name: "lines",
                            options: {
                                format: [{ // Line #0
                                    textField: "label",
                                    classed: {
                                        label: true
                                    },
                                    style: {
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        "font-weight": 500,
                                        fill: "black",
                                        opacity: "hidden"
                                    },
                                    attr: {
                                        "font-size": "1px",
                                        dy: "-30px",
                                        x: function(d) {
                                            return d.cx;
                                        },
                                        y: function(d) {
                                            return d.cy;
                                        }
                                    }
                                }, { // Line #0
                                    textField: "percent",
                                    classed: {
                                        label: true
                                    },
                                    style: {
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        fill: "black",
                                        opacity: "0"
                                    },
                                    attr: {
                                        "font-size": "1px",
                                        dy: "-4px",
                                        x: function(d) {
                                            return d.cx;
                                        },
                                        y: function(d) {
                                            return d.cy;
                                        }
                                    }
                                }, { // Line #1
                                    textField: "text",
                                    classed: {
                                        text: true
                                    },
                                    style: {
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        fill: "black",
                                        opacity: "0"
                                    },
                                    attr: {
                                        "font-size": "1px",
                                        dy: "20px",
                                        x: function(d) {
                                            return d.cx;
                                        },
                                        y: function(d) {
                                            return d.cy;
                                        }
                                    }
                                }, { // Line #2
                                    textField: "text2",
                                    classed: {
                                        text2: true
                                    },
                                    style: {
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        fill: "black",
                                        opacity: "0"
                                    },
                                    attr: {
                                        "font-size": "1px",
                                        dy: "40px",
                                        x: function(d) {
                                            return d.cx;
                                        },
                                        y: function(d) {
                                            return d.cy;
                                        }
                                    }
                                }, { // Line #3
                                    textField: "text3",
                                    classed: {
                                        text3: true
                                    },
                                    style: {
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        fill: "black",
                                        opacity: "0"
                                    },
                                    attr: {
                                        "font-size": "1px",
                                        dy: "60px",
                                        x: function(d) {
                                            return d.cx;
                                        },
                                        y: function(d) {
                                            return d.cy;
                                        }
                                    }
                                }],
                                centralFormat: [{ // Line #0
                                    attr: {
                                        "font-size": "28px"
                                    },
                                    style: {
                                        "opacity": "1"
                                    }
                                }, { // Line #1
                                    attr: {
                                        "font-size": "20px"
                                    },
                                    style: {
                                        "opacity": "1"
                                    }
                                }, { // Line #2
                                    attr: {
                                        "font-size": "18px"
                                    },
                                    style: {
                                        "opacity": "1"
                                    }
                                }, { // Line #3
                                    attr: {
                                        "font-size": "18px"
                                    },
                                    style: {
                                        "opacity": "1"
                                    }
                                }, { // Line #4
                                    attr: {
                                        "font-size": "48px"
                                    },
                                    style: {
                                        "opacity": "1"
                                    }
                                }, ]
                            }
                        }]
                    });

                    var tooltip = d3.select("body")
                        .append("div")
                        .style("position", "absolute")
                        .style("z-index", "10000000")
                        .style("visibility", "hidden")
                        .style("border", "1px solid black")
                        .style("background-color", "white")
                        .style("border-radius", "3px")
                        .style("padding", "3px")
                        .style("color", "black")
                        .style("max-width", "140px")
                        .style("padding", "10px")
                        .style("font-size", "12px");

                    var node = d3.selectAll(".node")
                        .on("mouseover", function(sender) {
                            var html = "<strong>Occupation: </strong>" + sender.item.fullText + "<br><strong> Category: </strong>" + sender.item.category + "<br> <strong>Employee Count: </strong>" + sender.item.label + "<br> <strong>Percentage: </strong>" + sender.item.percent;
                            tooltip.html(html);
                            return tooltip.style("visibility", "visible");
                        })
                        .on("mousemove", function() {
                            return tooltip.style("top", (d3.event.screenY - 100) + "px").style("left", (d3.event.screenX + 10) + "px");
                        })
                        .on("mouseout", function(event) {
                            d3.select(this).attr("stroke", "black").attr("stroke-width", "0");
                            return tooltip.style("visibility", "hidden");
                        });
                };


                /**
                 * Creates Age Pyramid
                 *
                 * @method createAgePyramid
                 */
                self.createAgePyramid = function() {
                    var stateLineMale = [];
                    var stateLineFemale = [];
                    self.pyramidData = [];
                    self.pyramidData.length = 0;
                    var combinedMaleValue = 0;
                    var combinedFemaleValue = 0;
                    var object;

                    $.each(self.groupedItems, function(key, item) {
                        if (item !== undefined) {
                            if (item.fieldName === "TOTAL_MALE") {
                                self.totalMale = item.fieldValue;
                            } else if (item.fieldName === "TOTAL_FEMALE") {
                                self.totalFemale = item.fieldValue;
                            } else if (item.fieldName === "M_Y18TO19" || item.fieldName === "M_Y20") {
                                combinedMaleValue += item.fieldValue;
                            } else if (item.fieldName === "M_Y21") {
                                combinedMaleValue += item.fieldValue;
                                object = jQuery.extend({}, item);
                                object.fieldValue = combinedMaleValue;
                                self.pyramidData.push(object);
                            } else if (item.fieldName === "F_Y18TO19" || item.fieldName === "F_Y20") {
                                combinedFemaleValue += item.fieldValue;
                            } else if (item.fieldName === "F_Y21") {
                                combinedFemaleValue += item.fieldValue;
                                object = jQuery.extend({}, item);
                                object.fieldValue = combinedFemaleValue;
                                self.pyramidData.push(object);
                            } else {
                                object = item;
                                self.pyramidData.push(object);
                            }
                        }
                    });
                    self.pyramidData.reverse();

                    // var url = demographicConfig.reports.stateSummary.ACSRestUrl;
                    // var whereClause = "NAME = 'Arizona State'";
                    // layerDelegate.query(url, self.populationPyramidComparison, self.dataQueryFault, null, whereClause, false, demographicConfig.agePyramidFields);

                    // self.populationPyramidComparison = function(results) {
                    //     var feature = results.features[0];
                    //     $.each(self.pyramidData, function(key, item) {
                    //         var baseLineValue = feature.attributes[item.fieldName];
                    //         if (item.tableHeader === "Females age 21") {
                    //             var value = feature.attributes["F_Y18TO19"] + feature.attributes["F_Y21"] + feature.attributes["F_Y20"];
                    //             var percentage = value / feature.attributes["TOTAL_FEMALE"];
                    //             stateLineFemale.push((percentage * self.totalFemale) * -1);
                    //         } else if (item.tableHeader.indexOf("Females") > -1) {
                    //             var percentage = baseLineValue / feature.attributes["TOTAL_FEMALE"];
                    //             stateLineFemale.push((percentage * self.totalFemale) * -1);
                    //         } else if (item.tableHeader === "Males age 21") {
                    //             var value = feature.attributes["M_Y18TO19"] + feature.attributes["M_Y21"] + feature.attributes["M_Y20"];
                    //             var percentage = value / feature.attributes["TOTAL_MALE"];
                    //             stateLineMale.push((percentage * self.totalMale));
                    //         } else {
                    //             var percentage = baseLineValue / feature.attributes["TOTAL_MALE"];
                    //             stateLineMale.push((percentage * self.totalMale));
                    //         }
                    //     });

                    var maleSeries = [];
                    var femaleSeries = [];

                    $.each(self.pyramidData, function(key, item) {
                        if (item.tableHeader.indexOf("Females") > -1) {
                            var negativeValue = item.fieldValue * -1;
                            femaleSeries.push(negativeValue);
                        } else {
                            maleSeries.push(item.fieldValue);
                        }
                    });

                    var chartObj = $("#demACSChartArea");
                    var largestValue = Math.max.apply(Math, maleSeries);
                    var valueAxisTemplate = "#= kendo.format(\'{0:N0}\', Math.abs(value))#";
                    var largeValue = false;
                    if (largestValue > 1000) {
                        if (largestValue > 5000) {
                            valueAxisTemplate = "#= kendo.format('{0:N0}', Math.abs(value) / 1000) #";
                        } else {
                            valueAxisTemplate = "#= kendo.format('{0:N1}', Math.abs(value) / 1000) #";
                        }
                        largeValue = true;
                    }


                    //Kendo-ize
                    var chart = chartObj.kendoChart({
                        legend: {
                            visible: self.legendACSVisible,
                            position: "bottom",
                            labels: {
                                color: "white"
                            }
                        },
                        series: [{
                                name: "Male",
                                type: "bar",
                                data: maleSeries,
                                color: "#00BFFF",
                            }, {
                                name: "Female",
                                type: "bar",
                                data: femaleSeries,
                                color: "#FF69B4",
                            },
                            // {
                            //     name: "State Male",
                            //     type: "line",
                            //     data: stateLineMale,
                            //     color: "#000",
                            //     stack: false,
                            //     tooltip: {
                            //         color: "white",
                            //         visible: true,
                            //         format: "{0:N0}",
                            //         template: "#=series.name # #= kendo.format(\'{0:P1}\', (value / " + self.totalMale + "))#"
                            //     }
                            // },
                            // {
                            //     name: "State Female",
                            //     type: "line",
                            //     data: stateLineFemale,
                            //     color: "#000",
                            //     stack: false,
                            //     tooltip: {
                            //         color: "white",
                            //         visible: true,
                            //         format: "{0:N0}",
                            //         template: "#=series.name # #= kendo.format(\'{0:P1}\', (Math.abs(value) / " + self.totalFemale + "))#"
                            //     }
                            // }
                        ],
                        seriesDefaults: {
                            stack: true,
                            tooltip: {
                                color: "black",
                                visible: true,
                                format: "{0:N0}",
                                template: "#=series.name # #= category #: #= kendo.format(\'{0:N0}\', Math.abs(value))#"
                            }
                        },
                        plotArea: {
                            margin: {
                                right: 30
                            }
                        },
                        chartArea: {
                            background: "#4D4D4D",
                            margin: {
                                left: 15,
                                top: 5,
                                right: 15
                            }
                        },
                        categoryAxis: [{
                            categories: ["85 and up", "80 to 84", "75 to 79", "70 to 74", "67 to 69", "65 to 66", "62 to 64", "60 to 61", "55 to 59", "50 to 54", "45 to 49", "40 to 44", "35 to 39", "30 to 34", "25 to 29", "22 to 24", "18 to 21", "15 to 17", "10 to 14", "5 to 9", "Less than 5"],
                            border: "black",
                            majorGridLines: {
                                visible: false
                            },
                            labels: {
                                margin: {
                                    right: 195
                                },
                                color: "#FFFFFF"
                            }
                        }],
                        valueAxis: {
                            color: "white",
                            labels: {
                                template: valueAxisTemplate
                            },
                            title: {
                                text: "*Values shown in thousands",
                                font: "10px Arial,Helvetica,sans-serif",
                                visible: largeValue
                            },
                            majorGridLines: {
                                visible: false
                            }
                        }
                    }).data("kendoChart");
                    // };

                };

                /**
                 * Create the Summary Report div element and Kendo-ize it as a Grid with comparison columns.
                 * Uses self.aggValuesArray as dataSource.
                 *
                 * @method createKendoGrid
                 */
                self.createKendoGridWithCompare = function(type) {

                    var dataGridName = "demACSDataGrid";
                    var demoOptionsRowName = "demACSSummaryOptionsRow";
                    var dataSource = self.aggACSValuesArray;

                    if (type === "census") {
                        dataGridName = "demCensusDataGrid";
                        demoOptionsRowName = "demCensusSummaryOptionsRow";
                        dataSource = self.aggCensusValuesArray;
                    }

                    $.each(dataSource, function(i, value) {
                        if (value["fieldType"] === "Currency") {
                            value["compareValueFormatted"] = "$ " + magNumberFormatter.formatValue(value["compareValue"]);
                        } else if (value["fieldType"] === "Rate") {
                            value["percentValueFormatted"] = magNumberFormatter.formatValue(value["fieldValue"]) + "%";
                            value["fieldValueFormatted"] = "-";
                        }

                    });

                    // Create the div element for the grid
                    dc.create("div", {
                        id: dataGridName,
                        style: "margin: 5px 0 0 0; font-size: small;"
                    }, demoOptionsRowName, "after");
                    var gridObj = $("#" + dataGridName);
                    // Kendo-ize

                    gridObj.kendoGrid({
                        dataSource: {
                            data: dataSource,
                            group: {
                                field: "fieldGroup"
                            },
                            sort: {
                                field: "fieldRowSort",
                                dir: "asc"
                            }
                        },
                        selectable: true,
                        scrollable: true,
                        sortable: false,
                        resizable: true,
                        columnMenu: false,
                        columns: [{
                                field: "fieldGroup",
                                title: "Category",
                                hidden: true,
                                groupHeaderTemplate: "#=value#"
                            }, {
                                field: "tableHeader",
                                title: " ",
                                width: "120px"
                            }, {
                                field: "fieldValueFormatted",
                                title: "Total",
                                format: "{0:n1}"
                            }, {
                                field: "percentValueFormatted",
                                title: "Percent"
                            },
                            //{field: "densityValueFormatted", title: "Per Sq Mile", format: "{0:n1}"},
                            {
                                field: "compareValueFormatted",
                                title: "Total",
                                format: "{0:n1}"
                            }, {
                                field: "comparePercentValueFormatted",
                                title: "Percent"
                            },
                            //{field: "compareDensityValueFormatted",title: "Per Sq Mile", format: "{0:n1}"}
                        ],
                        dataBound: function(e) {
                            if (this.wrapper[0].id !== "demCensusDataGrid") {
                                // get the index of the UnitsInStock cell
                                var rowCollection = e.sender.tbody[0].children;
                                var data = e.sender._data;
                                var realRows = [];

                                $.each(rowCollection, function(i, row) {
                                    if (row.className !== "k-grouping-row") {
                                        realRows.push(row);
                                    }
                                });
                                $.each(realRows, function(i, row) {
                                    if (data[i]) {
                                        if (data[i]["fieldCategory"] === "Occupation") {
                                            if (data[i].parentField === "" || data[i].fieldName === "ProtectiveServ") {
                                                var jRow = $(row);
                                                jRow.addClass("k-header");
                                                jRow.removeClass("k-alt");
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    });

                    // Add the categories
                    // Found a post from Brian Seekford at the URL below on how to do this.
                    //http://brianseekford.com/index.php/2013/05/14/how-to-add-complex-headers-to-a-kendo-grid-using-simple-jquery-javascript/
                    gridObj.find("thead").first().prepend("<tr><th></th><th></th><th class='colT' scope='colgroup' colspan='2'>" + self.communityName + "</th><th class='colT' scope='colgroup' colspan='2'>" + self.compareToName + "</th></tr>");

                    self.sizeGrid("#" + dataGridName);
                };

                /**
                 * Exports the kendo grid to excel.  See (http://demos.telerik.com/kendo-ui/grid/excel-export) for more info
                 *
                 * @method exportToExcel
                 */
                self.exportToExcel = function(sender) {
                    var exportButtonId = sender.currentTarget.id;
                    var grid;
                    var fileName;
                    var headerValue = self.communityName;
                    var colSpan;
                    var rowSpan;
                    var sourceLabel = appConfig.sourceLabel;

                    if (exportButtonId === "demACSExportResults") {
                        //Summary report export button clicked
                        grid = $("#demACSDataGrid").data("kendoGrid");
                        headerValue = self.communityName + " ACS 2014 Data";
                        fileName = self.communityName + ".xlsx";
                        if (self.compareFeature === null) {
                            colSpan = 4;
                            rowSpan = 25;
                        } else {
                            colSpan = 6;
                            rowSpan = 18;
                        }
                    } else if (exportButtonId === "demCensusExportResults") {
                        grid = $("#demCensusDataGrid").data("kendoGrid");
                        headerValue = self.communityName + " Census 2010 Data";
                        fileName = self.communityName + ".xlsx";
                        sourceLabel = appConfig.sourceLabel2;
                        if (self.compareFeature === null) {
                            colSpan = 4;
                            rowSpan = 25;
                        } else {
                            colSpan = 6;
                            rowSpan = 18;
                        }
                    } else if (exportButtonId === "demCensusExportSelFeatResults") {
                        //Block group export clicked
                        grid = $("#demCensusFeatGrid").data("kendoGrid");
                        headerValue = "Selected Block Groups";
                        fileName = self.communityName + ".xlsx";
                        sourceLabel = appConfig.sourceLabel2;
                        colSpan = 40;
                        rowSpan = 6;
                    } else if (exportButtonId === "demACSExportSelFeatResults") {
                        //Block group export clicked
                        grid = $("#demACSFeatGrid").data("kendoGrid");
                        headerValue = "Selected Block Groups";
                        fileName = self.communityName + ".xlsx";
                        colSpan = 22;
                        rowSpan = 7;
                    }

                    if (self.compareFeature !== null && exportButtonId !== "demCensusExportSelFeatResults" && exportButtonId !== "demACSExportSelFeatResults") {
                        headerValue = self.communityName + " - " + self.compareToName + " Comparative Demographic Report";
                    }

                    grid.bind("excelExport", function(e) {
                        var rows = e.workbook.sheets[0].rows;
                        var columns = e.workbook.sheets[0].columns;
                        columns[1].width = 290;
                        if (exportButtonId !== "demCensusExportSelFeatResults" && exportButtonId !== "demACSExportSelFeatResults") {
                            $.each(rows, function(index, row) {
                                if (row.type === "group-header") {
                                    row.cells[0].value = row.cells[0].value.substring(37);
                                } else {

                                    if (row.cells[1].value.indexOf("Male Population") > -1 || row.cells[1].value.indexOf("Female Population") > -1) {
                                        row.cells[1].value = row.cells[1].value.replace("Male Population", "Male Population:");
                                        row.cells[1].value = row.cells[1].value.replace("Female Population", "Female Population:");
                                        $.each(row.cells, function(i, value) {
                                            if (i > 0) {
                                                value.background = "#333";
                                                value.color = "#fff";
                                            }
                                        });
                                    }

                                    row.cells[1].value = row.cells[1].value.replace("Males age", "Age");
                                    row.cells[1].value = row.cells[1].value.replace("Males less", "Less");
                                    row.cells[1].value = row.cells[1].value.replace("Females age", "Age");
                                    row.cells[1].value = row.cells[1].value.replace("Females less", "Less");
                                }
                            });
                        }

                        e.workbook.sheets[0]["name"] = "Demographic Data";
                        e.workbook.sheets[0]["frozenRows"] = 2;

                        var headerRow = {
                            cells: [{
                                background: "#000",
                                colSpan: colSpan,
                                color: "#fff",
                                rowSpan: 1,
                                fontSize: 14,
                                value: headerValue,
                                hAlign: "center"
                            }],
                            height: 30,
                            headerRow: "added"
                        };

                        var sourceRow = {
                            cells: [{
                                background: "#000",
                                colSpan: colSpan,
                                color: "#fff",
                                rowSpan: 1,
                                fontSize: 11,
                                value: sourceLabel,
                                hAlign: "left",
                                wrap: true
                            }]
                        };

                        var footerRow = {
                            cells: [{
                                background: "#d3d3d3",
                                colSpan: colSpan,
                                color: "#000",
                                rowSpan: rowSpan,
                                fontSize: 8,
                                value: appConfig.legalDisclaimer,
                                hAlign: "center",
                                wrap: true
                            }]
                        };
                        var compareRow = null;
                        if (self.compareFeature !== null) {
                            compareRow = {
                                cells: [{
                                    background: "#fff"
                                }, {
                                    background: "#fff"
                                }, {
                                    background: "#fff",
                                    color: "#000",
                                    fontSize: 12,
                                    colSpan: 2,
                                    value: self.communityName,
                                    hAlign: "center",
                                    wrap: true
                                }, {
                                    background: "#fff",
                                    color: "#000",
                                    fontSize: 12,
                                    value: self.compareToName,
                                    colSpan: 2,
                                    hAlign: "center",
                                    wrap: true
                                }]
                            };
                        }

                        if (rows[0].headerRow !== "added") {
                            //Add custom header row
                            if (compareRow !== null && exportButtonId !== "demCensusExportSelFeatResults" && exportButtonId !== "demACSExportSelFeatResults") {
                                rows.unshift(compareRow);
                            }
                            rows.unshift(headerRow);
                            //console.log(compareRow);

                            rows.push(sourceRow);
                            rows.push(footerRow);
                        }

                        e.workbook.fileName = fileName;
                    });
                    grid.saveAsExcel();
                    grid.unbind("excelExport");
                };

                self.exportPDFReport = function() {
                    var parameterString = "";
                    var newWindow;
                    if (self.compareFeature) {
                        if (self.communityName === "Selected Block Groups") {
                            var ObjectIdArray = "";
                            for (var i = 0; i < self.selectedFeatures.length; i++) {
                                ObjectIdArray += self.selectedFeatures[i].attributes.OBJECTID + ",";
                            }
                            parameterString = "StateInteractive";
                            localStorage.OBJECTID = ObjectIdArray;
                        } else {
                            parameterString = self.communityName;
                        }
                        self.reportURL = encodeURI(demographicConfig.exportPDFCompareReportUrl + "?city1=" + parameterString + "&?city2=" + self.compareToName);
                        newWindow = window.open(self.reportURL, "_new");
                    } else {
                        if (self.communityName.indexOf("County") > -1) {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?county=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName.indexOf("Legislative") > -1) {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?legislative=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName.indexOf("Congressional") > -1) {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?congressional=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName.indexOf("Supervisor") > -1) {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?supervisor=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName.indexOf("District") > -1) {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?council=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName.indexOf("Governments") > -1 || self.communityName.indexOf("COG") > -1 || self.communityName.indexOf("MPO") > -1) {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?cog=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName === "Selected Block Groups") {
                            var ObjectIdArray = "";

                            for (var i = 0; i < self.selectedFeatures.length; i++) {
                                if (i !== self.selectedFeatures.length & self.selectedFeatures.length !== 1) {
                                    ObjectIdArray += self.selectedFeatures[i].attributes.OBJECTID + ",";
                                } else {
                                    ObjectIdArray += self.selectedFeatures[i].attributes.OBJECTID;
                                }
                            }
                            localStorage.OBJECTID = ObjectIdArray;
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?StateInteractive");
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName === "Arizona State") {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?state=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else if (self.communityName.length === 5 && !isNaN(parseInt(self.communityName))) {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?zipCode=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        } else {
                            self.reportURL = encodeURI(demographicConfig.exportPDFReportUrl + "?city=" + self.communityName);
                            newWindow = window.open(self.reportURL, "_new");
                        }
                    }
                };

                /**
                 * Callback method for errors returned by the print export.
                 *
                 * @method printMapError
                 * @param {Error} error - error object
                 */
                self.printMapError = function(error) {
                    console.log(error.message);
                };


                /**
                 * Create an iFrame, if it does not already exist, for downloading files.
                 *
                 * @method downloadURL
                 * @param {string} url - url to the document to be downloaded.
                 */
                self.downloadURL = function(url) {
                    var hiddenIFrameID = "hiddenDownloader",
                        iframe = document.getElementById(hiddenIFrameID);
                    if (iframe === null) {
                        iframe = document.createElement("iframe");
                        iframe.id = hiddenIFrameID;
                        iframe.style.display = "none";
                        document.body.appendChild(iframe);
                    }
                    iframe.src = url;
                };

                /**
                 * Simply resets comparison combo boxes
                 *
                 * @method resetComparisonDropdowns
                 */
                self.resetComparisonDropdowns = function() {
                    var resetObject = [{
                        combobox: "#demCensusCompareComboBox",
                        grid: "#demCensusDataGrid",
                        checkbox: "#demCensusUseComp",
                        type: "census"
                    }, {
                        comboBox: "#demACSCompareComboBox",
                        grid: "#demACSDataGrid",
                        checkBox: "#demACSUseComp",
                        type: "acs"
                    }];

                    var test = $("#demCensusCompareComboBox").data("kendoComboBox");
                    if (test !== null) {
                        test.destroy();
                        test.wrapper.remove();
                    }


                    $.each(resetObject, function(i, value) {
                        $(value.checkbox).prop("checked", false);
                        var compareComboBoxInput = $(value.comboBox);
                        var compareComboBoxObj = compareComboBoxInput.data("kendoComboBox");
                        if (compareComboBoxObj !== null) {
                            compareComboBoxObj.destroy();
                            compareComboBoxObj.wrapper.remove();
                        } else {}
                        var kendoGrid = $(value.grid).data("kendoGrid");
                        if (kendoGrid !== undefined && kendoGrid !== null) {
                            kendoGrid.element.remove();
                            kendoGrid.destroy();
                        }
                        self.createKendoGrid(value.type);
                    });
                };
            }; //end DemographicVM
            return DemographicVM;
        } // end function
    );
}());
