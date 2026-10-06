var colNamesMeetingDetail = '';
var colModelMeetingDetail = '';
var colNamesMeetingList = '';
var colModelMeetingList = '';
var colMeetingListColumnSort = '';
var colMeetingDetailColumnSort = '';
var countryMultiSelectDefaultArr = new Array;
var fundMultiSelectDefaultArr = new Array;
var fundFamilyMultiSelectDefaultArr = new Array;
var vdsDownloadMeetingListURL = '';
var vdsDownloadMeetingDetailURL = '';
var MeetingDetailsColumnsForExport = '';
var downloadAlertMessage=' Download in Progress....';

vdsApp.compileProvider.
	directive('vdsHeader', function(vdsServices, FileSaver, Blob) {

		return {
			restrict: 'E',
			transclude: true,

			scope: {
				data: '=data'
			},
			controller: ['$scope', '$http', '$compile', '$location', '$anchorScroll', '$routeParams', '$sce', function($scope, $http, $compile, $location, $anchorScroll, $routeParams, $sce) {
				$scope.commonDashboardProperties = vdsServices.getDashboardProperties();
				$scope.customDashboardProperties = vdsServices.getCustomProperties();

				$scope.headerPath = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/img/header.png?version=' + vdsServices.getCSSJSVersion();


				$scope.getCustomOrCommonData = function(custom, common) {
					var CustomOrCommonData = '';
					if (custom != '' && custom != undefined) {
						CustomOrCommonData = custom;
					}
					else {
						CustomOrCommonData = common;
					}
					return CustomOrCommonData;
				};

				$scope.headerDashboardText = $scope.getCustomOrCommonData($scope.customDashboardProperties.headerDashboardText, $scope.commonDashboardProperties.headerDashboardText);


				$scope.headerDashboardTextTitle = $scope.getCustomOrCommonData($scope.customDashboardProperties.headerDashboardTextTitle, $scope.commonDashboardProperties.headerDashboardTextTitle);
				$scope.directiveFile = $scope.customDashboardProperties.directiveFile;
				/*
				if($scope.customDashboardProperties.policySectionLeftTextShow == undefined)
				{
					$scope.policySectionLeftTextShow = 'false';
				}
				*/
				$scope.policySectionLeftText = $scope.getCustomOrCommonData($scope.customDashboardProperties.policySectionLeftText, $scope.commonDashboardProperties.policySectionLeftText);
				if (vdsServices.getCommonOrCustomLanguage() === 'custom') {
					$scope.policySectionLeftText = vdsServices.getPreferLanguageProperties().policySectionLeftText;
				}
				$scope.policySectionLeftText = $sce.trustAsHtml($scope.policySectionLeftText);

				/*if($scope.customDashboardProperties.policySectionLeftText == undefined || $scope.customDashboardProperties.policySectionLeftText == '')
				{
					$scope.policySectionLeftText = '';
				}
				
				if($scope.customDashboardProperties.policySectionRightTextShow == undefined)
				{
					$scope.policySectionRightTextShow = 'false';
				}*/

				$scope.policySectionRightText = $scope.getCustomOrCommonData($scope.customDashboardProperties.policySectionRightText, $scope.commonDashboardProperties.policySectionRightText);
				if (vdsServices.getCommonOrCustomLanguage() === 'custom') {
					$scope.policySectionRightText = vdsServices.getPreferLanguageProperties().policySectionRightText;
				}
				$scope.policySectionRightText = $sce.trustAsHtml($scope.policySectionRightText);
				/*
				if($scope.customDashboardProperties.policySectionRightText == undefined || $scope.customDashboardProperties.policySectionRightText == '')
				{
					$scope.policySectionRightText = '';
				}
		
				if($scope.policySectionLeftTextShow == 'false' && $scope.policySectionRightTextShow == 'false')
				{
					$scope.policySectionShow = 'false';
				}
				else
				{
					$scope.policySectionShow = 'true';
				}
				*/

				$scope.policyButtonText = $scope.getCustomOrCommonData($scope.customDashboardProperties.policyButtonText, $scope.commonDashboardProperties.policyButtonText);

				if (vdsServices.getCommonOrCustomLanguage() === 'custom') {
					$scope.policyButtonText = vdsServices.getPreferLanguageProperties().policyButtonText;
				}

				$scope.ISSPolicyLink = $scope.getCustomOrCommonData($scope.customDashboardProperties.ISSPolicyLink, $scope.commonDashboardProperties.ISSPolicyLink);
				$scope.policyUrls = null;
				if(vdsServices.getPreference() && vdsServices.getPreference() && vdsServices.getPreference().policyUrls && vdsServices.getPreference().policyUrls.length) {
					$scope.policyUrls = vdsServices.getPreference().policyUrls;
					$scope.ISSPolicyLink = $scope.policyUrls[0];
				}
				// VDS-1963: Defining policyNames so that policy names are fetched dynamically, helps in policy reordering
				$scope.policyNames = null;
				if(vdsServices.getPreference() && vdsServices.getPreference().policyNames && vdsServices.getPreference().policyNames.length) {
					$scope.policyNames = vdsServices.getPreference().policyNames;
				}

				$scope.logoLink = $scope.getCustomOrCommonData($scope.customDashboardProperties.logoLink, $scope.commonDashboardProperties.logoLink);

				$scope.policySectionEmailText = $scope.getCustomOrCommonData($scope.customDashboardProperties.policySectionEmailText, $scope.commonDashboardProperties.policySectionEmailText);

				$scope.pageTitleText = $scope.getCustomOrCommonData($scope.customDashboardProperties.pagetitle, $scope.commonDashboardProperties.pagetitle);
				if(vdsUtility.isEmpty(vdsServices.getPreference().GraphicalMetrics)) {
					$scope.customDashboardProperties.liveSiteFormat = "meetingDrillDown";
					$scope.commonDashboardProperties.liveSiteFormat = "meetingDrillDown";
					$scope.customDashboardProperties.stagingSiteFormat = "meetingDrillDown";
					$scope.commonDashboardProperties.stagingSiteFormat = "meetingDrillDown";
				}
				$scope.siteFormat = $scope.getCustomOrCommonData($scope.customDashboardProperties.liveSiteFormat, $scope.commonDashboardProperties.liveSiteFormat);

				$scope.policyLinks = $scope.getCustomOrCommonData($scope.customDashboardProperties.policyLinks, $scope.commonDashboardProperties.policyLinks);


				if ($scope.policyLinks) {
					$scope.policyLink1 = $scope.policyLinks.policyLink1;

					$scope.policyLink2 = $scope.policyLinks.policyLink2;

					$scope.policyLink3 = $scope.policyLinks.policyLink3;

				}
				$scope.customCss = $scope.getCustomOrCommonData($scope.customDashboardProperties.customCss, $scope.commonDashboardProperties.customCss);
				//console.log($scope.customCss);

				$scope.debugMode = '';
				if ($routeParams.debug != undefined && $routeParams.debug != '') {
					$scope.debugMode = $routeParams.debug;
				}

				$scope.CustomerId = vdsServices.getCustomerId();
				$scope.URLFundFamily = '';
				if ($scope.debugMode != '') {
					var tmpParams = $scope.debugMode.split("|");

					for (var j = 0; j < tmpParams.length; j++) {
						subParams = tmpParams[j].split('=');

						if (subParams[0] == 'FundFamily' && subParams[1] != '') {
							$scope.URLFundFamily = subParams[1];
						}
						if (subParams[0] == 'SiteMode' && subParams[1] == 'MeetingDrilldown' && $scope.CustomerId == '3541') {
							$scope.siteFormat = subParams[1];
						}

					}
				}

				//console.log($scope.siteFormat);
				if ($scope.siteFormat == "dashboard") {
					//console.log($scope.headerDashboardText);
					$scope.headerDashboardText = $scope.headerDashboardTextTitle;
					//						console.log($scope.headerDashboardText);
				}

				if (vdsServices.getCommonOrCustomLanguage() === 'custom')
					$scope.headerDashboardText = vdsServices.getPreferLanguageProperties().headerDashboardText;


				if ($scope.pageTitleText != '') {
					document.title = $scope.pageTitleText;
				}


				$scope.customerPreference = vdsServices.getPreference();
				if (vdsServices.isLiveSite() == 1)	//live site
				{
					var GraphicalMetricsArr = $scope.customerPreference.GraphicalMetrics.split('|');
				}
				else								//staging site
				{
					var GraphicalMetricsArr = $scope.customerPreference.GraphicalMetrics.split('|');
				}

				$scope.searchBoxContents = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchBoxContents, $scope.commonDashboardProperties.searchBoxContents);


				$scope.SearchBoxAnchorLink = $scope.searchBoxContents.SearchBoxAnchorLink;


				GraphicalMetricsArr.reverse();
				var graphicsTitle = $scope.getCustomOrCommonData($scope.customDashboardProperties.GraphicsTitle, $scope.commonDashboardProperties.GraphicsTitle);
				var graphicsLabel = $scope.getCustomOrCommonData($scope.customDashboardProperties.GraphicsLabel, $scope.commonDashboardProperties.GraphicsLabel);
				var meetingListLabel = $scope.getCustomOrCommonData($scope.customDashboardProperties.MeetingListLabel, $scope.commonDashboardProperties.MeetingListLabel);
				var meetingDetailsLabel = $scope.getCustomOrCommonData($scope.customDashboardProperties.MeetingDetailsLabel, $scope.commonDashboardProperties.MeetingDetailsLabel);

				var enableMeetingListDownload = $scope.getCustomOrCommonData($scope.customDashboardProperties.enableMeetingListDownload, $scope.commonDashboardProperties.enableMeetingListDownload);
				var enableMeetingDetailDownload = $scope.getCustomOrCommonData($scope.customDashboardProperties.enableMeetingDetailDownload, $scope.commonDashboardProperties.enableMeetingDetailDownload);
				var includeprintcss = $scope.getCustomOrCommonData($scope.customDashboardProperties.includeprintcss, $scope.commonDashboardProperties.includeprintcss);
				var exportButtonText = $scope.getCustomOrCommonData($scope.customDashboardProperties.ExportButtonText, $scope.commonDashboardProperties.ExportButtonText);
				var anchorLinks = "";
				var exportAnchorLink = "";
				var anchorLinksAppend = "";
               
				meetingListLabel = vdsServices.getPreferLanguageProperties().MeetingListLabel!=undefined ? vdsServices.getPreferLanguageProperties().MeetingListLabel: meetingListLabel;				
				meetingDetailsLabel = vdsServices.getPreferLanguageProperties().MeetingDetailsLabel!=undefined ? vdsServices.getPreferLanguageProperties().MeetingDetailsLabel: meetingDetailsLabel;	
				graphicsLabel = vdsServices.getPreferLanguageProperties().GraphicsLabel!=undefined ? vdsServices.getPreferLanguageProperties().GraphicsLabel: graphicsLabel;
				exportButtonText = vdsServices.getPreferLanguageProperties().ExportButtonText!=undefined ? vdsServices.getPreferLanguageProperties().ExportButtonText: exportButtonText;
				downloadAlertMessage = vdsServices.getPreferLanguageProperties().DownloadAlertMessage!=undefined ? vdsServices.getPreferLanguageProperties().DownloadAlertMessage: downloadAlertMessage;
				graphicsTitle = vdsServices.getPreferLanguageProperties().GraphicsTitle!=undefined ? vdsServices.getPreferLanguageProperties().GraphicsTitle: graphicsTitle;

				var flag = false;
				if ($scope.siteFormat == "dashboard") {
					if (GraphicalMetricsArr != "") {


						anchorLinksAppend = "<span ><a ng-click=\"scrollTo('SearchAnchor',$event)\" class='anchorClass resetFilter'>" + vdsServices.getPreferLanguageProperties()[$scope.SearchBoxAnchorLink] + "</a></span>";
					}
					else {
						anchorLinksAppend = "<span></span>";
					}			
                if(vdsServices.isLiveSite() == 1)				
                {
				if($scope.customerPreference.EnableMeetingListDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingListExportLink" ng-click="downloadTemplate()">'+meetingListLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.EnableMeetingDetailDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingDetailsExportLink" ng-click="downloadMeetingDetailTemplate()">'+meetingDetailsLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.IncludePrintCSS == true)
				{
					//exportAnchorLink += '<a href="javascript:print()" data-toggle="tooltip" title="'+ graphicsTitle +'">'+graphicsLabel+'</a>';
					exportAnchorLink += '<a class="exportanchor" ng-click="OpenPrintPopUp()">'+graphicsLabel+'</a>';
				flag = true;
				}
				if(flag)
				{
					var anchorTag = '<div class = "dropdown headerexportanchor"><a class="dropAnchor">'+exportButtonText+'</a>';
					var parentDiv = '<div class="dropdown-content headerexportcontent">';
					var endingDiv = '</div></div>';
					anchorLinks += anchorTag + parentDiv+ exportAnchorLink + endingDiv;
				}
                }

                if(vdsServices.isLiveSite() == 0)				
                {
				if($scope.customerPreference.StagingEnableMeetingListDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingListExportLink" ng-click="downloadTemplate()">'+meetingListLabel+'</a>';
					flag = true;
				}
				if($scope.customerPreference.StagingEnableMeetingDetailDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingDetailsExportLink" ng-click="downloadMeetingDetailTemplate()">'+meetingDetailsLabel+'</a>';
					flag = true;
				}
				if($scope.customerPreference.StagingIncludePrintCSS == true)
				{
					//exportAnchorLink += '<a href="javascript:print()" data-toggle="tooltip" title="'+ graphicsTitle +'">'+graphicsLabel+'</a>';
					exportAnchorLink += '<a class="exportanchor" ng-click="OpenPrintPopUp()">'+graphicsLabel+'</a>';
					flag = true;
				}
				if(flag)
				{
					var anchorTag = '<div class = "dropdown headerexportanchor"><a class="dropAnchor">'+exportButtonText+'</a>';
					var parentDiv = '<div class="dropdown-content headerexportcontent">';
					var endingDiv = '</div></div>';
					anchorLinks += anchorTag + parentDiv+ exportAnchorLink + endingDiv;
				}
                }


					//anchorLinks += '<span title="Export Meeting Listing"><a ng-click="downloadTemplate()" class="anchorClass resetFilter" id="downloadtemplate" style = "margin-left:10px;float:right">DownloadMeetingList</a></span>';
					//anchorLinks += '<span title="Export Meeting Detail"><a ng-click="downloadMeetingDetailTemplate()" class="anchorClass resetFilter" id="downloadmeetingdetailtemplate" style = "margin-left:10px;float:right">DownloadMeetingDetail</a></span>';*/
					//anchorLinks += '<span class="download-dropdown"><button class="download-button">Download<i class="fa fa-caret-down"></i></button><span class="dropdown-content"><a ng-click="downloadTemplate()" id="downloadtemplate">Meeting List</a><a ng-click="downloadMeetingDetailTemplate()" id="downloadtemplate">Meeting Detail</a></span></span>';
					angular.forEach(GraphicalMetricsArr, function(templateValue) {


						angular.forEach($scope.data, function(directiveValue) {

							if (directiveValue.componentID == templateValue) {
								var anchorText = directiveValue.anchorText;
								angular.forEach($scope.CustomDirectiveText, function(customValue) {

									if (customValue.componentID == directiveValue.componentID) {
										if (customValue.anchorText != '') {
											anchorText = customValue.anchorText;
										}
									}
								})
								anchorLinks += "<span ><a ng-click=\"scrollTo('" + directiveValue.anchorElement + "',$event)\" class=\"" + directiveValue.anchorClass + "\" >" + vdsServices.getPreferLanguageProperties()[anchorText] + "</a></span>";


							}
						});
					});
					/*	 var anchorLinks = "";
						 var anchorLinksAppend = "<span ><a ng-click=\"scrollTo('SearchAnchor',$event)\" class='anchorClass resetFilter'>"+ $scope.SearchBoxAnchorLink +"</a></span>";			 
						 angular.forEach( GraphicalMetricsArr, function(templateValue) {
							angular.forEach($scope.data, function(directiveValue) {					
							  
								  if(directiveValue.componentID == templateValue)
								  {
									   anchorLinks += "<span ><a ng-click=\"scrollTo('"+directiveValue.anchorElement+"',$event)\" class=\""+directiveValue.anchorClass+"\">"+directiveValue.anchorText+"</a></span>";
								  }
							});
						});*/
				}
				else {
				if(vdsServices.isLiveSite() == 1)				
				{
				if($scope.customerPreference.EnableMeetingListDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingListExportLink" ng-click="downloadTemplate()">'+meetingListLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.EnableMeetingDetailDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingDetailsExportLink" ng-click="downloadMeetingDetailTemplate()">'+meetingDetailsLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.IncludePrintCSS == true)
				{
					//exportAnchorLink += '<a href="javascript:print()" data-toggle="tooltip" title="'+ graphicsTitle +'">'+graphicsLabel+'</a>';
				flag = true;
				}
				if(flag)
				{
					var anchorTag = '<div class = "dropdown headerexportanchor"><a class="dropAnchor">'+exportButtonText+'</a>';
					var parentDiv = '<div class="dropdown-content headerexportcontent">';
					var endingDiv = '</div></div>';
					anchorLinks += anchorTag + parentDiv+ exportAnchorLink + endingDiv;
				}
				}

				if(vdsServices.isLiveSite() == 0)				
				{
				if($scope.customerPreference.StagingEnableMeetingListDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingListExportLink" ng-click="downloadTemplate()">'+meetingListLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.StagingEnableMeetingDetailDownload == true)
				{
					exportAnchorLink += '<a class="exportanchor meetingDetailsExportLink" ng-click="downloadMeetingDetailTemplate()">'+meetingDetailsLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.StagingIncludePrintCSS == true)
				{
					//exportAnchorLink += '<a href="javascript:print()" data-toggle="tooltip" title="'+ graphicsTitle +'">'+graphicsLabel+'</a>';
				
				}
				if(flag)
				{
					var anchorTag = '<div class = "dropdown headerexportanchor"><a class="dropAnchor">'+exportButtonText+'</a>';
					var parentDiv = '<div class="dropdown-content headerexportcontent">';
					var endingDiv = '</div></div>';
					anchorLinks += anchorTag + parentDiv+ exportAnchorLink + endingDiv;
				}
				}


				}
				
				if(anchorLinks != '')
				{
				var myEl = angular.element(document.querySelector('#HeaderAnchor'));
				angular.element(document.getElementById('HeaderAnchor')).append($compile(anchorLinks + anchorLinksAppend)($scope));
				}
				//myEl.append(anchorLinks);  

				//$("#HeaderAnchor").append(anchorLinks);


				//console.log($scope.URLFundFamily);

				$scope.scrollTo = function(id, event) {
					//event.preventDefault();
					/*
					event.stopPropagation();
					$scope.$on('$locationChangeStart', function(ev) {
					  ev.preventDefault();
					});
					*/
					var old = $location.hash();
					$location.hash(id);
					$anchorScroll();

					$location.hash(old);



					//scrollMe();
				};
				$scope.OpenPrintPopUp = function() {				
				$('#printmodal .modal-body').html(graphicsTitle);
				$('#printmodal').modal('show');
				if (vdsServices.getPreferLanguageProperties().Cancel != undefined) {
					$(".printbtn.printbtn-secondary").text("" + vdsServices.getPreferLanguageProperties().Cancel + "");
				}
				if (vdsServices.getPreferLanguageProperties().ExportButtonText != undefined) {
					$(".printbtn.printbtn-primary.print").text("" + vdsServices.getPreferLanguageProperties().ExportButtonText + "");
				}
				};
				MeetingDetailsColumnsForExport = $scope.commonDashboardProperties.MandatoryColumnsMeetingDetailExport + '|' + vdsServices.getMeetingDetailColumns();
				//$scope.downloadMeetingListTemplate = downloadMeetingListTemplate($scope,$http,FileSaver);	
				meetingListColumnArray = $scope.customerPreference.MeetingListColumns.split('|');
				//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [START]
				vdsAppHelper.updateMeetingListColumnArraySignificant(meetingListColumnArray, $scope.customerPreference.SignificantMeetingTypeID);
				//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]
				$scope.pageSize = $scope.getCustomOrCommonData($scope.customDashboardProperties.pageSize, $scope.commonDashboardProperties.pageSize);
				$scope.downloadTemplate = function () {
					  $( ' .headerexportcontent' ).find('.meetingListExportLink').attr("disabled","disabled");
					  $( ' .headerexportcontent' ).find('.meetingListExportLink').append('<div class="dot-elastic"></div>');
					  $('.addaleartmessage').append('<div class="alert alert-success meetingListalert" ><button type="button" class="close" onclick="delAlertMessage(\'meetingListalert\')">×</button>'+downloadAlertMessage+'</div>');
					  vdsDownloadMeetingListURL +="&actionCode=115&sessionToken="+loggerHelperConfig.sessionToken;
					$http({
						method: 'GET',
						responseType: 'arraybuffer',
						url: vdsDownloadMeetingListURL,
						params: {
							//MeetingTypeList: '',
							//CountryList: '',
							VotedList: '',
							rows: $scope.pageSize,
							page: 1,
							SortByColumn: colMeetingListColumnSort,
							OrderBy: "asc",
							meetingListColumns: meetingListColumnArray,
							locale: vdsServices.getlanguageUse()
						},
						headers: {
							'Accept': "application/vnd.ms-excel"
						}
					}).then(function(response) {
						var blob = new Blob([response.data], {
							type: 'application/vnd.ms-excel'
						});
						var fileName = response.headers("Content-Disposition").split(';')[1].trim().split('=')[1];
						FileSaver.saveAs(blob, fileName);
						$( '.headerexportcontent' ).find('.meetingListExportLink').removeAttr("disabled");
						$( '.headerexportcontent' ).find('.meetingListExportLink .dot-elastic').remove();
						$( '.meetingListalert' ).remove();
					}, function error(response) {
						$( '.headerexportcontent' ).find('.meetingListExportLink').removeAttr("disabled");
						$( '.headerexportcontent' ).find('.meetingListExportLink .dot-elastic').remove();
						$( '.meetingListalert' ).remove();
					});
				};
				//VDS-990 - Moved this code to vds-app.js - [START]
				/*
				var uniqueColumns = [];
				var meetingListColumnsFromDb = $scope.customerPreference.MeetingListColumns.split('|');
				var meetingDetailColumns = MeetingDetailsColumnsForExport.split('|');
				var meetingDetailColumnArray = meetingListColumnsFromDb.concat(meetingDetailColumns);
				var displayNotesTypeID = $scope.customerPreference.DisplayNotesTypeID;
				if(displayNotesTypeID == 1)
				{
					meetingDetailColumnArray.push('notes');
				}
				else if(displayNotesTypeID == 2)
				{
					meetingDetailColumnArray.push('researchNotes');
				}
				else if(displayNotesTypeID ==3)
				{
					meetingDetailColumnArray.push('notes');
					meetingDetailColumnArray.push('researchNotes');
				}
				else if(displayNotesTypeID == 4)
				{
					meetingDetailColumnArray.push('blendedRationale');
				}
				else if(displayNotesTypeID == 5)
				{
					meetingDetailColumnArray.push('contextualNotes');
				}
				meetingDetailColumnArray.forEach(function(itm){
					rtn =  findUnique(itm, uniqueColumns);
					if(rtn==0)
					uniqueColumns.push(itm);
					});
					if(uniqueColumns.indexOf("proposalCategory")>-1){
						uniqueColumns.push("proposalSubcategory");
					}
					//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]
					var indexOfSignificantVote = uniqueColumns.indexOf("significantVote");
					if(indexOfSignificantVote>-1 && $scope.customerPreference.SignificantMeetingTypeID===1){
						uniqueColumns.splice(indexOfSignificantVote,1);
					}	
					//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]
					*/
				//VDS-990 - Moved this code to vds-app.js - [END]	
				$scope.downloadMeetingDetailTemplate = function() {
					vdsAppHelper.vdsBodyAjScope.updateMeetingDetailURLParameter(vdsDownloadMeetingDetailURL,"signVote",vdsAppHelper.getSignificantVoteFilterQueryParam());
					$( ' .headerexportcontent' ).find('.meetingDetailsExportLink').attr("disabled","disabled");
					$( ' .headerexportcontent' ).find('.meetingDetailsExportLink').addClass('paddingLeft5pxImpo');
					$( ' .headerexportcontent' ).find('.meetingDetailsExportLink').append('<div class="dot-elastic"></div>');
					$('.addaleartmessage').append('<div class="alert alert-success meetingDetailsalert" ><button type="button" class="close" onclick="delAlertMessage(\'meetingDetailsalert\')">×</button>'+downloadAlertMessage+'</div>');
					vdsDownloadMeetingDetailURL+="&actionCode=116&sessionToken="+loggerHelperConfig.sessionToken;
				$http({
					method: 'GET',
					responseType: 'arraybuffer',
					url: vdsDownloadMeetingDetailURL,
					params: {
						rows: $scope.pageSize,
						SortByColumn: 'CompanyName|SeqNumber',
						OrderBy: "asc",
						meetingDetailColumns: vdsAppHelper.getMeetingDetailsUniqueColumnsForExport(),
						displayNotesTypeID: $scope.customerPreference.DisplayNotesTypeID,
						locale: vdsServices.getlanguageUse()
					},
					headers: {
						'Accept': "application/vnd.ms-excel"
					}
				}).then(function(response) {
					var blob = new Blob([response.data], {
						type: 'application/vnd.ms-excel'
					});
					var fileName = response.headers("Content-Disposition").split(';')[1].trim().split('=')[1];
					FileSaver.saveAs(blob, fileName);
					$( '.headerexportcontent' ).find('.meetingDetailsExportLink').removeAttr("disabled");
					$( '.headerexportcontent' ).find('.meetingDetailsExportLink').removeClass('paddingLeft5pxImpo');
					$( '.headerexportcontent' ).find('.meetingDetailsExportLink .dot-elastic').remove();
					$( '.meetingDetailsalert' ).remove();
				}, function error(response) {
				    $( '.headerexportcontent' ).find('.meetingDetailsExportLink').removeAttr("disabled");
					$( '.headerexportcontent' ).find('.meetingDetailsExportLink').removeClass('paddingLeft5pxImpo');
					$( '.headerexportcontent' ).find('.meetingDetailsExportLink .dot-elastic').remove();
					$( '.meetingDetailsalert' ).remove();
				});
			}
				/*
				$scope.$watch('$location.hash', function () {
					_.defer($anchorScroll);
				});
				*/

				/*
				$(function(){
					var doc = new jsPDF();
					var specialElementHandlers = {
						'#editor': function (element, renderer) {
							return true;
						}
					};
		
					$('#cmd').click(function () {
						alert('hi')
						doc.fromHTML($('#MgmtChart').html(), 15, 15, {
							'width': 170,
								'elementHandlers': specialElementHandlers
						});
						doc.save('sample-file.pdf');
					});
				});
				
				
				$(function() { 
					$("#btnSave").click(function() { 
						html2canvas($("#MgmtChart"), {
							onrendered: function(canvas) {
								theCanvas = canvas;
								document.body.appendChild(canvas);
		
								// Convert and download as image 
								Canvas2Image.saveAsPNG(canvas); 
								$("#img-out").append(canvas);
								// Clean up 
								//document.body.removeChild(canvas);
							}
						});
					});
				}); 
			*/


				//$(function(){

				function scrollMe() {
					var _top = $(window).scrollTop();
					var _direction;
					$(window).scroll(function() {
						var _cur_top = $(window).scrollTop();
						if (_top < _cur_top) {
							_direction = 'down';
						}
						else {
							_direction = 'up';
						}

						if (_cur_top == 0 || _top == 0) {
							//$("#mynav").css("margin-top","41px");
							$('#mynav').removeClass('navbar-fixed-top');
							$('#mynav').addClass('navbar-static-top');
							/*
							//$("#mynav").hide('slow');			
							$("#mynav").show().animate({ marginTop: '0px' }, 200);
							*/

						}
						else {
							//$("#mynav").hide();
							//$("#mynav").css("margin-top","0px");
							//$("#mynav").show().animate({ marginTop: '0px' }, 200);								
							//$("#mynav").show().animate(200);

							$('#mynav').addClass('navbar-fixed-top');
							$('#mynav').removeClass('navbar-static-top');
						}
						_top = _cur_top;
						//console.log(_direction+"=>"+_top+"=>"+_cur_top);
					});
				}
				//});
				/*
				if($(window).scrollTop() > 0)
				{
					//$("#mynav").hide();
					//$("#mynav").css("margin-top","0px");								
					//$("#mynav").show().animate(200);
					
					$('#mynav').addClass('navbar-fixed-top');	
					$('#mynav').removeClass('navbar-static-top');
				}
				else
				{
					//$("#mynav").css("margin-top","41px");
					$('#mynav').removeClass('navbar-fixed-top');	
					$('#mynav').addClass('navbar-static-top');
				}
				*/
				$(window).scroll(function() {

					$("#filterDropSearch").hide();
				});

				$(window).resize(function() {
					$("#filterDropSearch").hide();
					$('#mynav').width($('#vdsBaseTempl').width() - 1);
					//scrollNav();
				});



				//scrollMe();

				//prevent backspace from taking user out of dashboard
				document.onkeydown = function(event) {

					if (!event) { /* This will happen in IE */
						event = window.event;
					}

					var keyCode = event.keyCode;

					if (keyCode == 8 &&
						((event.target || event.srcElement).tagName != "TEXTAREA") &&
						((event.target || event.srcElement).tagName != "INPUT") &&
						((event.target || event.srcElement).tagName != "SELECT")) {

						if (navigator.userAgent.toLowerCase().indexOf("msie") == -1) {
							event.stopPropagation();
						} else {
							//alert("prevented");
							event.returnValue = false;
						}

						return false;
					}
				};


				//================================ CODE TO DISPLAY FAVICON IF IT EXISTS ======================
				$scope.showFavicon = $scope.getCustomOrCommonData($scope.customDashboardProperties.showFavicon, $scope.commonDashboardProperties.showFavicon);

				if ($scope.showFavicon == "true") {
					$.browser.chrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());

					if ($.browser.chrome) {
						//console.log("ABCD");
						//var src = '/repo/6673/img/favicon.ico';
						var src = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/img/favicon.ico';
						//console.log(src);
						//var src = './6673/img/favicon.ico';	
						//console.log('TEST');
						//console.log(src);
						//var src = 'http://muuwdp048:8080/repo/6673/img/favicon.ico?v1';
						//var src = 'https://www.cbussuper.com.au/etc/designs/cbussuper/favicon.ico';
						var link = document.createElement('link'),
							oldLink = document.getElementById('dynamic-favicon');
						link.id = 'dynamic-favicon';
						link.rel = 'shortcut icon';
						link.href = src;
						// console.log(link.href);
						if (oldLink) {
							document.head.removeChild(oldLink);
						}
						document.head.appendChild(link);
					}

					setTimeout(function() {
						// Chrome allows you to simply tweak the HREF of the LINK tag.
						// Firefox appears to require that you remove it and readd it.
						function setFavicon(url) {
							removeFavicon();
							var link = document.createElement('link');
							link.type = 'image/gif';
							link.rel = 'icon';
							link.href = url;
							document.getElementsByTagName('head')[0].appendChild(link);
							//if (window.console) console.log("Set FavIcon URL to " + getFavicon().href);
						}

						function removeFavicon() {
							var links = document.getElementsByTagName('link');
							var head = document.getElementsByTagName('head')[0];
							for (var i = 0; i < links.length; i++) {
								if (links[i].getAttribute('rel') === 'icon') {
									head.removeChild(links[i]);
								}
							}
						}

						function getFavicon() {
							var links = document.getElementsByTagName('link');
							for (var i = 0; i < links.length; i++) {
								if (links[i].getAttribute('rel') === 'icon') {
									return links[i];
								}
							}
							return undefined;
						}

						//setFavicon(vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+'/'+ vdsServices.getCustomerId() + '/img/favicon.ico');
						$.browser.chrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
						if (!$.browser.chrome) {

							var src = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/img/favicon.ico';
							setFavicon(src);
						}
						/*
						//var src = '/repo/6673/img/favicon.ico';
						var src = vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+'/'+ vdsServices.getCustomerId() + '/img/favicon.ico';	
						var src = 'https://www.cbussuper.com.au/etc/designs/cbussuper/favicon.ico';
						 var link = document.createElement('link'),
							 oldLink = document.getElementById('dynamic-favicon');
						 link.id = 'dynamic-favicon';
						 link.rel = 'shortcut icon';
						 link.href = src;
						 if (oldLink) {
						  document.head.removeChild(oldLink);
						 }
						 document.head.appendChild(link);
						 */


					}, 100);
				}

				//================================ CODE TO DISPLAY FAVICON IF IT EXISTS ENDS======================

				/*$(document).ready(function () {
					
					
					
					//var origOffsetY = $('#mynav').offset().top - $(window).scrollTop();			
					var origOffsetY = 85;
					
					//$('#mynav').width($('#vdsBaseTempl').width()-1);
					
					function scrollNav() 
					{				
						
						if ($(window).scrollTop() >= origOffsetY) 
						{
							$('#mynav').removeClass('navbar-static-top').addClass('navbar-fixed-top NavTop');
							$('#mynav').width($('#vdsBaseTempl').width());
							//console.log('scroll top inside=>'+$(window).scrollTop()+'scroll nav=>'+origOffsetY);
						} 
						else
						{
							$('#mynav').removeClass('navbar-fixed-top NavTop').addClass('navbar-static-top');
							//$('#mynav').width($('#vdsBaseTempl').width());
							$('#mynav').width('100%');
							//console.log('scroll top outside=>'+$(window).scrollTop()+'scroll nav=>'+origOffsetY);					
						}
		
		
					}*/
					// rest call for downloading meeting details in Excel format
				
				$(document).ready(function() {



					var origOffsetY = 85;
					var origOffset = 5;

					function scrollNav() {
						if ($(window).scrollTop() >= 100) {
							origOffset = 100;
						}
						if ($(window).scrollTop() >= origOffsetY) {
							$('#mynav').removeClass('navbar-static-top').addClass('navbar-fixed-top NavTop');
							$('body').addClass('BodyPadding');
							$('#mynav').width($('#vdsBaseTempl').width());
						}
						else {
							$('#mynav').removeClass('navbar-fixed-top NavTop').addClass('navbar-static-top');
							$('body').removeClass('BodyPadding');

							$('#mynav').width('100%');

							if (origOffset >= 100) {
								$(window).scrollTop(0);
								origOffset = 5;

							}
						}


					}


					document.onscroll = scrollNav;

					$('.print').click(function(){
						$('#printmodal').modal('hide');
						$(".modal-backdrop.in").hide();
						$('body').removeClass('modal-open');
						setTimeout(function(){ window.print(); }, 400);
				   });

				   $('#printmodal').on('hidden', function () {
					$('body').removeClass('modal-open');
					});
					$('#printmodal').on('show', function () {
						
						$('body').addClass('modal-open');
						if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )){
							$('.modal-dialog-centered').css('top', '38%');
							$('.modal').css('overflow', 'hidden');
							$(".print").prop("disabled",true);
							$('.print').css('background-color', '#cccccc');
							$('.print').css('color', '#666666');
							$('.print').css('border', '1px solid #999999');							
						  }  
						});
				});
				if(vdsServices.getPreference() && vdsServices.getPreference()["EnableAuth"]) {
					$scope.userAuthenticated = true;
				}

				//VDS-1893: Displaying EDS site in VDS Dashboard header based on the flag value
				$scope.showEDSSiteYN = $scope.customerPreference.ShowEDSSiteYN;
				$scope.EDSSiteURL = $scope.customerPreference.EDSSiteURL;
			}],
			//templateUrl: vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+'/'+ vdsServices.getCustomerId() +'/directives/templates/header.html?version='+vdsServices.getCSSJSVersion(),
			templateUrl: function() {
				var templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/app/js/vds_components/templates/header.html?version=' + vdsServices.getCSSJSVersion();
				var customTemplateFile = vdsServices.getCustomProperties().headerTemplate;
				if (customTemplateFile != '' && customTemplateFile != undefined) {
					if (customTemplateFile != 'global') {
						templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/templates/header.html?version=' + vdsServices.getCSSJSVersion();
					}
				}

				var commonTemplateFile = vdsServices.getDashboardProperties().headerTemplate;
				if (commonTemplateFile != '' && commonTemplateFile != undefined) {
					if (commonTemplateFile != 'global') {
						templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/templates/header.html?version=' + vdsServices.getCSSJSVersion();
					}
				}

				return templateUrl;
			},
			link: function($scope, $element, $attrs, controller) {

				$('.anchorClass').click(function() {

					//setTimeout(setFloatingNav(), 100);

					setFloatingNav();
					//$("#mynav").css("margin-top","0px");
				});

				function setFloatingNav() {
					var _cur_top = $(window).scrollTop();

					//console.log(_cur_top);
					if (_cur_top == 0) {
						//console.log('41');
						//$("#mynav").css("margin-top","41px");
					}
					else {
						//console.log('0');
						//$("#mynav").css("margin-top","0");
						//console.log($("#mynav").css("margin-top"));
						setTimeout(function() {
							$("#mynav").css("margin-top", "0px");
						}, 10);
					}
				}





			}



		};
	});


vdsApp.compileProvider.
	directive('vdsBody', function(vdsServices, operatorList, checkboxFilter, startFromFilter, paginationService, LazyDirectiveLoader, FileSaver, Blob) {



		return {
			restrict: 'E',
			transclude: true,
			scope: {
				data: '=data'
			},
			controller: ['$scope', '$http', '$compile', '$routeParams', '$filter', '$location', '$q', function($scope, $http, $compile, $routeParams, $filter, $location, $q) {
				vdsAppHelper.vdsBodyAjScope = $scope;
				vdsAppHelper.vdsServices = vdsServices;
				$scope.CustomerID = vdsServices.getCustomerId();
				if($scope.CustomerID == 3541 && vdsServices.getPreference().InteractiveGraphs)
				{
				$(".graphicsFootnote").show();
				}
				else{
					$(".graphicsFootnote").hide();
				}
				$scope.commonDashboardProperties = vdsServices.getDashboardProperties();
				$scope.customDashboardProperties = vdsServices.getCustomProperties();

				$scope.getCustomOrCommonData = function(custom, common) {
					var CustomOrCommonData = '';
					if (custom != '' && custom != undefined) {
						CustomOrCommonData = custom;
					}
					else {
						CustomOrCommonData = common;
					}
					return CustomOrCommonData;
				};
				$scope.ExportButtonText = $scope.getCustomOrCommonData($scope.customDashboardProperties.ExportButtonText,$scope.commonDashboardProperties.ExportButtonText);				
				//var isAppliedFilterEnable = $scope.getCustomOrCommonData($scope.customDashboardProperties.ShowAppliedFilter,$scope.commonDashboardProperties.ShowAppliedFilter);
				//$scope.showAppliedFilter = isAppliedFilterEnable != undefined && isAppliedFilterEnable != 'false' && isAppliedFilterEnable != ''  ? true:false;				
						
				$scope.customerPreference = vdsServices.getPreference();
				$scope.showAppliedFilter = 	$scope.customerPreference.AppliedFilterText;
				if ($scope.customerPreference.SearchFilterColumns != '') {
					var tmpSearchFilterColumns = vdsAppHelper.updateTmpSearchFilterColumnsSignificant($scope.customerPreference.SearchFilterColumns.split("|"));
					for (var j = 0; j < tmpSearchFilterColumns.length; j++) {
						
						eval("$scope.show" + tmpSearchFilterColumns[j] + "=true;")
						columncount++;
						if (tmpSearchFilterColumns[j] == "fundfamily") {
							$scope.fundfamilyinsearchfilter = "true";
							//	console.log($scope.fundfamilyinsearchfilter);
						}
						if (tmpSearchFilterColumns[j] == "significant") {
							$scope.showSignificant = "true";
							//	console.log($scope.fundfamilyinsearchfilter);
						}
						if (tmpSearchFilterColumns[j] == "fund") {
							$scope.showfund = "true";
							//	console.log($scope.fundfamilyinsearchfilter);
						}
						

					}
				}


				// angular.element(document).ready(function () {
				// 	//Angular breaks if this is done earlier than document ready.\
				// 	if($scope.showSignificant){
				// 		$(".withoutSignMeeting").remove();
				// 	}else{
				// 		$(".withSignMeeting").remove();
				// 	}
				// });

				//$scope.EncodedCustomerID = $routeParams.id;
				//$scope.searchCriteria.countryListValue = [];
				//console.log('getDashboardProperties=>'+JSON.stringify(vdsServices.getDashboardProperties()));

				$scope.selectedStatisticsGraphList = { name: '', clear: false };
				$scope.selectedManagementGraphList = { name: '', clear: false };
				$scope.selectedProposalGraphList = { name: '', clear: false };
				$scope.selectedAlignMgmtProposalGraphList = { name: '', clear: false };
				$scope.selectedMarketGraphList = { name: '', clear: false };
				$scope.selectedMeetingTypeGraphList = { name: '', clear: false };
				$scope.selectedSectorGraphList = { name: '', clear: false };
				$scope.actualUrl = '';
				$scope.meetingListTemplateUrl = '';
				$scope.meetingDetailTemplateUrl = '';

				if ($scope.customDashboardProperties.colNamesMeetingDetail != '' && $scope.customDashboardProperties.colModelMeetingDetail != '') {
					colNamesMeetingDetail = $scope.customDashboardProperties.colNamesMeetingDetail;
					colModelMeetingDetail = $scope.customDashboardProperties.colModelMeetingDetail;
				}
				else {
					colNamesMeetingDetail = $scope.commonDashboardProperties.colNamesMeetingDetail;
					colModelMeetingDetail = $scope.commonDashboardProperties.colModelMeetingDetail;
				}
				//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [START]
				var indexOfSignificantVote = colNamesMeetingDetail.indexOf("Significant Vote");
				if(indexOfSignificantVote>-1 && ($scope.customerPreference.SignificantMeetingTypeID===1 || $scope.customerPreference.SignificantMeetingTypeID===2)){
					colModelMeetingDetail[indexOfSignificantVote]["hidden"] = true;
				}
				//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]
				

				if($scope.customDashboardProperties.liveSiteFormat!='' && $scope.customDashboardProperties.liveSiteFormat=='meetingDrillDown' ){
					$scope.graphicsFootnote = false;
				}

				if($scope.customDashboardProperties.liveSiteFormat!='' && $scope.customDashboardProperties.liveSiteFormat=='dashboard' ){
					$scope.graphicsFootnote = true;
				}
			
				for (i = 0; i < colNamesMeetingDetail.length; i++) {

					if (vdsServices.getPreferLanguageProperties()[colNamesMeetingDetail[i]] != null) {

						colNamesMeetingDetail[i] = vdsServices.getPreferLanguageProperties()[colNamesMeetingDetail[i]];
					}
				}

				$scope.loadMeetingListCount = 1;
				$scope.ExpandButtonText = $scope.getCustomOrCommonData($scope.customDashboardProperties.ExpandButtonText, $scope.commonDashboardProperties.ExpandButtonText);

				$scope.CollapseButtonText = $scope.getCustomOrCommonData($scope.customDashboardProperties.CollapseButtonText, $scope.commonDashboardProperties.CollapseButtonText);



				if (vdsServices.isLiveSite() == 1)	//live site
				{
					$scope.siteFormat = $scope.getCustomOrCommonData($scope.customDashboardProperties.liveSiteFormat, $scope.commonDashboardProperties.liveSiteFormat);
					//$scope.siteFormat = 'meetinglist';					
				}
				else								//staging site
				{
					$scope.siteFormat = $scope.getCustomOrCommonData($scope.customDashboardProperties.stagingSiteFormat, $scope.commonDashboardProperties.stagingSiteFormat);
					//$scope.siteFormat = 'meetinglist';	
				}
				var graphicsTitle = $scope.getCustomOrCommonData($scope.customDashboardProperties.GraphicsTitle, $scope.commonDashboardProperties.GraphicsTitle);
				$scope.createExportButton = function(scope, compile, id, exportButtonText)
				{
				var flag = false;
				var anchorLinks = '';
				//var ExportButtonText = $scope.getCustomOrCommonData($scope.customDashboardProperties.ExportButtonText, $scope.commonDashboardProperties.ExportButtonText);
				var graphicsLabel = $scope.getCustomOrCommonData($scope.customDashboardProperties.GraphicsLabel, $scope.commonDashboardProperties.GraphicsLabel);
				var meetingListLabel = $scope.getCustomOrCommonData($scope.customDashboardProperties.MeetingListLabel, $scope.commonDashboardProperties.MeetingListLabel);
				var meetingDetailsLabel = $scope.getCustomOrCommonData($scope.customDashboardProperties.MeetingDetailsLabel, $scope.commonDashboardProperties.MeetingDetailsLabel);

				var enableMeetingListDownload = $scope.getCustomOrCommonData($scope.customDashboardProperties.enableMeetingListDownload, $scope.commonDashboardProperties.enableMeetingListDownload);
				var enableMeetingDetailDownload = $scope.getCustomOrCommonData($scope.customDashboardProperties.enableMeetingDetailDownload, $scope.commonDashboardProperties.enableMeetingDetailDownload);
				var includeprintcss = $scope.getCustomOrCommonData($scope.customDashboardProperties.includeprintcss, $scope.commonDashboardProperties.includeprintcss);
				var success = 'success';

				meetingListLabel = vdsServices.getPreferLanguageProperties().MeetingListLabel!=undefined ? vdsServices.getPreferLanguageProperties().MeetingListLabel: meetingListLabel;				
				meetingDetailsLabel = vdsServices.getPreferLanguageProperties().MeetingDetailsLabel!=undefined ? vdsServices.getPreferLanguageProperties().MeetingDetailsLabel: meetingDetailsLabel;	
				graphicsLabel = vdsServices.getPreferLanguageProperties().GraphicsLabel!=undefined ? vdsServices.getPreferLanguageProperties().GraphicsLabel: graphicsLabel;
				exportButtonText = vdsServices.getPreferLanguageProperties().ExportButtonText!=undefined ? vdsServices.getPreferLanguageProperties().ExportButtonText: exportButtonText;
				downloadAlertMessage = vdsServices.getPreferLanguageProperties().DownloadAlertMessage!=undefined ? vdsServices.getPreferLanguageProperties().DownloadAlertMessage: downloadAlertMessage;
				graphicsTitle = vdsServices.getPreferLanguageProperties().GraphicsTitle!=undefined ? vdsServices.getPreferLanguageProperties().GraphicsTitle: graphicsTitle;

				//Live Mapping
				if(vdsServices.isLiveSite() == 1)				
				{
				if($scope.customerPreference.EnableMeetingListDownload == true)
				{
					anchorLinks += '<a class="exportanchor meetingListExportLink" ng-click="downloadTemplate()">'+meetingListLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.EnableMeetingDetailDownload == true)
				{
					anchorLinks += '<a class="exportanchor meetingDetailsExportLink" ng-click="downloadMeetingDetailTemplate()">'+meetingDetailsLabel+'</a>';
				flag = true;
				}
				if($scope.customerPreference.IncludePrintCSS == true)
				{
					anchorLinks += '<a class="exportanchor" ng-click="OpenPrintPopUp()">'+graphicsLabel+'</a>';
				flag = true;
				}
				if(flag)
				{
					var button = '<button class="dropbtn">'+exportButtonText+'</button>';
					var parentDiv = '<div class="dropdown-content">';
					var endingDiv = '</div>';
					angular.element(document.getElementById(id)).append(compile(button + parentDiv+ anchorLinks + endingDiv)(scope));
				}
				}

				//Staging
				if(vdsServices.isLiveSite() == 0)				
				{
				if($scope.customerPreference.StagingEnableMeetingListDownload == true)
				{
					anchorLinks += '<a class="exportanchor meetingListExportLink" ng-click="downloadTemplate()">'+meetingListLabel+'</a>';
					flag = true;
				}
				if($scope.customerPreference.StagingEnableMeetingDetailDownload == true)
				{
					anchorLinks += '<a class="exportanchor meetingDetailsExportLink" ng-click="downloadMeetingDetailTemplate()">'+meetingDetailsLabel+'</a>';
					flag = true;
				}
				if($scope.customerPreference.StagingIncludePrintCSS == true)
				{
					anchorLinks += '<a class="exportanchor" ng-click="OpenPrintPopUp()">'+graphicsLabel+'</a>';
					flag = true;
				}
				if(flag)
				{
					var button = '<button class="dropbtn">'+exportButtonText+'</button>';
					var parentDiv = '<div class="dropdown-content">';
					var endingDiv = '</div>';
					angular.element(document.getElementById(id)).append(compile(button + parentDiv+ anchorLinks + endingDiv)(scope));
				}
				}


				}


				
				$scope.exportButtonText = $scope.getCustomOrCommonData($scope.customDashboardProperties.ExportButtonText, $scope.commonDashboardProperties.ExportButtonText);	
				if($scope.siteFormat != 'dashboard')
				{
					$scope.createExportButton($scope,$compile, 'exportDataTable',$scope.exportButtonText);
				}

				$scope.showfundsMeetingDetail = $scope.getCustomOrCommonData($scope.customDashboardProperties.showfundsMeetingDetail, $scope.commonDashboardProperties.showfundsMeetingDetail);


				$scope.debugMode = '';
				if ($routeParams.debug != undefined && $routeParams.debug != '') {
					$scope.debugMode = $routeParams.debug;
				}


				$scope.URLFundFamily = '';
				if ($scope.debugMode != '') {
					var tmpParams = $scope.debugMode.split("|");

					for (var j = 0; j < tmpParams.length; j++) {
						subParams = tmpParams[j].split('=');

						if (subParams[0] == 'FundFamily' && subParams[1] != '') {
							$scope.URLFundFamily = subParams[1];
						}
						if (subParams[0] == 'SiteMode' && subParams[1] == 'MeetingDrilldown' && $scope.CustomerID == '3541') {
							$scope.siteFormat = subParams[1];
						}

					}
				}
				/*
				//var parseObj = $scope.commonDashboardProperties.colModelMeetingDetail;
				var parseObj = colModelMeetingDetail;
				var x;
									
				for(x in parseObj)
				{
						if(parseObj[x].formatter != '')	
						{
							parseObj[x].formatter=eval(parseObj[x].formatter);					
						}
						if(parseObj[x].sorttype != '')	
						{
							parseObj[x].sorttype=eval(parseObj[x].sorttype);					
						}			
				}
								
				colModelMeetingDetail = parseObj;
				*/

				var colNamesMeetingList = '';
				var colModelMeetingList = '';

				/*
				if($scope.customDashboardProperties.colNamesMeetingList != '' && $scope.customDashboardProperties.colModelMeetingList != '')
				{				
					colNamesMeetingList = $scope.customDashboardProperties.colNamesMeetingList;
					colModelMeetingList = $scope.customDashboardProperties.colModelMeetingList;
				}
				else
				{				
					colNamesMeetingList = $scope.commonDashboardProperties.colNamesMeetingList;
					colModelMeetingList = $scope.commonDashboardProperties.colModelMeetingList;
				}
	
				
				var parseObj = colModelMeetingList;										
				
				var x;
									
				for(x in parseObj)
				{
						if(parseObj[x].formatter != '')	
						{
							parseObj[x].formatter=eval(parseObj[x].formatter);									
						}					
				}						
				colModelMeetingList = parseObj;	
				*/

				// =========================== SEARCH / FILTER BOX DYNAMIC CONTENT SECTION STARTS ==================================
				$scope.searchBoxContents = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchBoxContents, $scope.commonDashboardProperties.searchBoxContents);

               
				if ($scope.customDashboardProperties.searchBoxContents != '' && $scope.customDashboardProperties.searchBoxContents != undefined && vdsServices.getlanguageUse() == 'en') {
					$scope.SearchBoxHeader = $scope.searchBoxContents.SearchBoxHeader;
					$scope.MeetingRangeBoxHeader = $scope.searchBoxContents.MeetingRangeBoxHeader;
					$scope.MeetingRangeFromBoxLabel = $scope.searchBoxContents.MeetingRangeFromBoxLabel;
					$scope.MeetingRangeToBoxLabel = $scope.searchBoxContents.MeetingRangeToBoxLabel;
					$scope.CompanySearchBoxLabel = $scope.searchBoxContents.CompanySearchBoxLabel;
					$scope.MarketSearchBoxLabel = $scope.searchBoxContents.MarketSearchBoxLabel;
					$scope.FundFamilySearchBoxLabel = $scope.searchBoxContents.FundFamilySearchBoxLabel;
					$scope.FundSearchBoxLabel = $scope.searchBoxContents.FundSearchBoxLabel;
					$scope.SignificantMeetingLabel = $scope.searchBoxContents.SignificantMeetingLabel;
					$scope.ResetFilterText = $scope.searchBoxContents.ResetFilterText;

				} else {
					$scope.SearchBoxHeader = vdsServices.getPreferLanguageProperties().SearchBoxHeader;
					$scope.MeetingRangeBoxHeader = vdsServices.getPreferLanguageProperties().MeetingRangeBoxHeader;
					$scope.MeetingRangeFromBoxLabel = vdsServices.getPreferLanguageProperties().MeetingRangeFromBoxLabel;
					$scope.MeetingRangeToBoxLabel = vdsServices.getPreferLanguageProperties().MeetingRangeToBoxLabel;
					$scope.CompanySearchBoxLabel = vdsServices.getPreferLanguageProperties().CompanySearchBoxLabel;
					$scope.MarketSearchBoxLabel = vdsServices.getPreferLanguageProperties().MarketSearchBoxLabel;
					$scope.FundFamilySearchBoxLabel = vdsServices.getPreferLanguageProperties().FundFamilySearchBoxLabel;
					$scope.FundSearchBoxLabel = vdsServices.getPreferLanguageProperties().FundSearchBoxLabel;
					$scope.SignificantMeetingLabel = vdsServices.getPreferLanguageProperties().SignificantMeetingLabel;
					$scope.ResetFilterText = vdsServices.getPreferLanguageProperties().ResetFilterText;
				}
				//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [START]
				if($scope.customerPreference.SignificantMeetingTypeID===2) {
					$scope.SignificantMeetingLabel = "Significant Meetings";
				} else if($scope.customerPreference.SignificantMeetingTypeID===3) {
					$scope.SignificantMeetingLabel = "Significant Votes";
				} else if($scope.customerPreference.SignificantMeetingTypeID===4){
					$scope.SignificantMeetingLabel = "Significant Meetings & Votes";
				}
				$scope.SignificantMeetingLabel = vdsAppHelper.getLangProperty($scope.SignificantMeetingLabel);
				//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]



				/* if ($scope.searchBoxContents.ResetFilterText == '' || $scope.searchBoxContents.ResetFilterText == undefined) {
					$scope.searchBoxContents.ResetFilterText = 'Reset Filters';
				}
				$scope.ResetFilterText = $scope.searchBoxContents.ResetFilterText; */
				$scope.searchBoxContents = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchBoxContents, $scope.commonDashboardProperties.searchBoxContents);

                //MEETING DETAILS LABELS DYNAMIC SEARCH VALUES.
					$scope.ticker = vdsServices.getPreferLanguageProperties().ticker;
					$scope.meetingDate = vdsServices.getPreferLanguageProperties().meetingDate;
					$scope.recordDate = vdsServices.getPreferLanguageProperties().recordDate;
					$scope.securityID = vdsServices.getPreferLanguageProperties().securityID;
					$scope.meetingTypeDetail = vdsServices.getPreferLanguageProperties().meetingTypeDetail;
					$scope.industrySector = vdsServices.getPreferLanguageProperties().industrySector;
					$scope.countryDetail = vdsServices.getPreferLanguageProperties().countryDetail;
          // VDS-1391- new label 
					$scope.cusip = vdsServices.getPreferLanguageProperties().cusip;
					$scope.isin = vdsServices.getPreferLanguageProperties().isin;
					$scope.sharesOnLoan = vdsServices.getPreferLanguageProperties().sharesOnLoan;
          // VDS-1391- new label 
					
				//DYNAMIC LABELS SEARCH VALUES FOR BODY SECTION
					$scope.back = vdsServices.getPreferLanguageProperties().back;
					$scope.resetMeetingFilters = vdsServices.getPreferLanguageProperties().resetMeetingFilters;
					$scope.noRecords = vdsServices.getPreferLanguageProperties().noRecords;
					$scope.noGraphicalDisplay = vdsServices.getPreferLanguageProperties().noGraphicalDisplay;
					$scope.noContentText = vdsServices.getPreferLanguageProperties().noContentText;
					$scope.Update = vdsServices.getPreferLanguageProperties().Update;
					$scope.CompanySearchPlaceholder = vdsServices.getPreferLanguageProperties().CompanySearchPlaceholder;
					$scope.interactiveGraphNote = vdsServices.getPreferLanguageProperties().interactiveGraphNote;
					$scope.filterSummaryHeader = vdsServices.getPreferLanguageProperties().filterSummaryHeader;

					

				// =========================== SEARCH / FILTER BOX DYNAMIC CONTENT SECTION ENDS ==================================



				// ============================================== DYNAMIC SEARCH CONTENT SECTION STARTS ====================================================

				$scope.fundfamilyinsearchfilter = false;
				$scope.showUpdate1 = false;
				$scope.showSignificant = false;
				$scope.showfund = false;
				var isMarketFlag = false;
				var columncount = 0;


				
				$scope.customerPreference = vdsServices.getPreference();

				if ($scope.customerPreference.SearchFilterColumns != '') {
					var tmpSearchFilterColumns = vdsAppHelper.updateTmpSearchFilterColumnsSignificant($scope.customerPreference.SearchFilterColumns.split("|"));
					for (var j = 0; j < tmpSearchFilterColumns.length; j++) {
						
						eval("$scope.show" + tmpSearchFilterColumns[j] + "=true;")
						columncount++;
						if (tmpSearchFilterColumns[j] == "fundfamily") {
							$scope.fundfamilyinsearchfilter = "true";
							//	console.log($scope.fundfamilyinsearchfilter);
						}
						if (tmpSearchFilterColumns[j] == "significant") {
							$scope.showSignificant = "true";
							//	console.log($scope.fundfamilyinsearchfilter);
						}
						if (tmpSearchFilterColumns[j] == "fund") {
							$scope.showfund = "true";
							//	console.log($scope.fundfamilyinsearchfilter);
						}
						

					}
				}
				
				$scope.filterCount = columncount;

				if (navigator.userAgent.toLowerCase().indexOf("trident") > 0) {
					//	console.log("IE 2");
					$(".messageDiv").removeClass("messageDiv").addClass("messageDivIE");
				}
				if (navigator.userAgent.toLowerCase().indexOf("firefox") > 0) {
					//	console.log("IE 3");
					$(".messageDivIE").removeClass("messageDivIE").addClass("messageDiv");
				}

				//console.log(columncount);
				/*if(columncount > 3)
				{
					$scope.showUpdate1 = true;
					//$('#showdate').removeClass('col-md-5').addClass('col-md-4');
				}
				if(columncount == 5)
				{
					//console.log("Change MD");
					$('#MeetingRangeBoxHeader').removeClass('col-md-5 col-sm-5 col-xs-5').addClass('col-md-4 col-sm-4 col-xs-4');
					$('#MarketSearchBoxLabel').removeClass('col-md-2 col-sm-2 col-xs-2').addClass('col-md-2 col-sm-2');
					$('#FundFamilySearchBoxLabel').removeClass('col-md-2 col-sm-2 col-xs-2').addClass('col-md-2 col-sm-2');
					$('#FundSearchBoxLabel').removeClass('col-md-3 col-sm-3 col-xs-3').addClass('col-md-2 col-sm-2');
					$('#CompanySearchBoxLabel').removeClass('col-md-3 col-sm-3 col-xs-3').addClass('col-md-2 col-sm-2');
	
					$('#MeetingRangeRow').removeClass('col-md-5 col-xs-5').addClass('col-md-4 col-sm-4 col-xs-4');
					$('#MarketRow').removeClass('col-md-2 col-xs-2').addClass('col-md-2 col-sm-2 col-xs-2');
					$('#FundFamilyRow').removeClass('col-md-4 col-xs-4').addClass('col-md-4 col-sm-4 col-xs-4');
					$('#CompanyRow').removeClass('col-md-3 col-xs-3').addClass('col-md-2 col-sm-2 col-xs-4');
					$('#fromDatepicker').removeClass('fromDatepicker').addClass('fromDateAllElements');
					$('#toDatepicker').removeClass('toDatepicker').addClass('toDateAllElements');	
				}*/


				// ============================================== DYNAMIC SEARCH CONTENT SECTION ENDS ====================================================

				// ============================================== PDF GENERATION SECTION STARTS ====================================================	
				$scope.isPdfClient = $scope.getCustomOrCommonData($scope.customDashboardProperties.isPdfClient, $scope.commonDashboardProperties.isPdfClient);
				//$scope.clientName = $scope.getCustomOrCommonData($scope.customDashboardProperties.isPdfClient,$scope.commonDashboardProperties.isPdfClient);
				$scope.generatePdf = function() {

					function toggleFullScreen() {
						if ((document.fullScreenElement && document.fullScreenElement !== null) ||
							(!document.mozFullScreen && !document.webkitIsFullScreen)) {
							if (document.documentElement.requestFullScreen) {
								document.documentElement.requestFullScreen();
							} else if (document.documentElement.mozRequestFullScreen) {
								document.documentElement.mozRequestFullScreen();
							} else if (document.documentElement.webkitRequestFullScreen) {
								document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
							}
						} else {
							if (document.cancelFullScreen) {
								document.cancelFullScreen();
							} else if (document.mozCancelFullScreen) {
								document.mozCancelFullScreen();
							} else if (document.webkitCancelFullScreen) {
								document.webkitCancelFullScreen();
							}
						}
					}

					function checkIfValueExist(inputVal) {
						if (inputVal != "") {
							return true;
						}
						else {
							return false;
						}
					}
					// Reporting Export will create the first page consisting of all the selected filters
					function reportingExport(abcd) {
						var toDate = "Today";
						var clientName = $scope.getCustomOrCommonData($scope.customDashboardProperties.clientName, $scope.commonDashboardProperties.clientName);
						//var clientName = "Swisscanto";						
						var fromDate = $('#fromDatepicker').val();
						var toDate = $('#toDatepicker').val();
						var searchParam = $('#companyTicker').val();
						var Regions = $('#countryMultiSelect1').next().find('button.countryMultiSelectButton').attr('title');
						var isAllRegion = $('#countryMultiSelect1').next().find('button.countryMultiSelectButton').text();
						var FundFamily = $('.fundFamilyMultiSelectClass').next().find('button.fundFamilyMultiSelectButton').attr('title');
						var isAllFundfamily = $('.fundFamilyMultiSelectClass').next().find('button.fundFamilyMultiSelectButton').text();
						var Fund = $('.fundMultiSelectClass').next().find('button.fundMultiSelectButton').attr('title');
						var isAllFund = $('.fundMultiSelectClass').next().find('button.fundMultiSelectButton').text();
						var str = '<table id="firstPageHeader">'
						str += '<tr><th colspan=2> Vote Disclosure Service PDF - ' + clientName + ' </th></tr></table><br /><br /><br />'
						str += '<table id="firstPage"><tr><td >Parameter</td><td >Value</td></tr><tr><td >Reporting Date:</td><td >' + fromDate + ' to ' + toDate + '</td></tr>';
						str += '<tr></tr>';
						if (checkIfValueExist(searchParam)) {
							str += '<tr><td >Company Search:</td><td >' + searchParam + '</td></tr>';
						}
						if (checkIfValueExist(Regions)) {
							str += '<tr><td >Market:</td><td >' + Regions + '</td></tr>';
						}
						//str += '<tr></tr>';
						if (checkIfValueExist(FundFamily)) {
							str += '<tr><td >Fund Family:</td><td >' + FundFamily + '</td></tr>';
						}
						//str += '<tr></tr>';
						if (checkIfValueExist(Fund)) {
							str += '<tr><td >Fund:</td><td >' + Fund + '</td></tr></table>';
						}
						$(abcd).contents().find('.container-fluid').prepend(str);
						return abcd;
						//return str;
					}

					// This would remove the filters section completely
					function removeFilters(abcd) {
						$(abcd).contents().find('.section.s1').remove();
						return abcd;
					}

					// This would remove the expand button since we do not have to export the meeting list
					function removeExpandBtn(abcd) {
						$(abcd).contents().find('.expand_Collapse').remove();
						$(abcd).contents().find('.expandClass').remove();

						return abcd;
					}

					// This would be used to make mandatory customizations for the graphs to fit in the PDF or any change which is common for all clients
					function mandatoryCustomizations(abcd) {


						$(abcd).contents().find('.PolicySectionContainer').append("<br /><br />");
						$(abcd).contents().find('.PolicySectionLeft').css('margin-left', '3%').css('width', '47%');
						$(abcd).contents().find('.container-fluid').css("width", "99.9%")
							.css("margin", "auto")
							.css("background-color", "white");
						$(abcd).contents().find('#hp-banner-management .bannerHeader:eq(0)').append("<br /><br />");
						$(abcd).contents().find('#mynav').removeClass().addClass("inner").width('100%');
						$(abcd).contents().find('.table-responsive').removeClass();
						$(abcd).contents().find('managementGraphTableTd').removeClass();
						$(abcd).contents().find('#freeTextMarket').removeClass().addClass("margXero freetext col-md-12 col-sm-12 col-xs-12");
						$(abcd).contents().find('#freeTextManagement').removeClass().addClass("margXero freetext col-md-12 col-sm-12 col-xs-12");
						$(abcd).contents().find('#freeTextSector').removeClass().addClass("margXero freetext col-md-12 col-sm-12 col-xs-12");
						$(abcd).contents().find('#freeTextProposalCat').removeClass().addClass("margXero freetext col-md-12 col-sm-12 col-xs-12");
						$(abcd).contents().find('#freeTextAlignMgmtProposalCat').removeClass().addClass("margXero freetext col-md-12 col-sm-12 col-xs-12");
						$(abcd).contents().find('#Div_meetingProposal_Image').removeClass().addClass("WidthZero col-md-0 col-sm-0 col-xs-0");
						$(abcd).contents().find('#divMeetingAlignMgmtProposalImage').removeClass().addClass("WidthZero col-md-0 col-sm-0 col-xs-0");
						$(abcd).contents().find('#donutLegend').css("font-size", "14px");
						$(abcd).contents().find('#geoChartLegend svg').css("min-width", "200px");
						$(abcd).contents().find('vds-header').remove();
						$(abcd).contents().find('#meetingDisplayGrid').css("display", "none");
						$(abcd).contents().find('vds-meetings-sector').css("width", "100%");
						$(abcd).contents().find('.meetingTypeNonPDF').css("display", "block");
						//$(abcd).contents().find('#votingStatisticsPDF').css("width","100%");
						$(abcd).contents().find('#ShareChartPDF').css("width", "50%");
						$(abcd).contents().find('#MgmtChartPDF').css("width", "50%");
						$(abcd).contents().find('hr').remove();
						$(abcd).contents().find('.hp-banner:even').parent().before("<hr>");
						return abcd;
					}

					// Any new CSS Style would need to be added xin this. Avoid inline styling as much as possible
					function cssStyles() {
						var styleCSS = "<style> g > text {font-size:12;font-weight: 200;} #firstPageFilters th {text-align:center !important;border:1px solid black !important;font-size: 20px !important;padding: 5px !important;} #firstPageFilters{margin-top:20%;text-align:center; width:95% !important;border: 1px solid black;margin-left:15px;margin-right:50px;width:100%} #firstPageHeader th {text-align:center !important;border:1px solid black !important;font-size: 20px !important;padding: 5px !important;} #firstPageHeader{margin-top:20%;text-align:center; width:95% !important;border: 1px solid black;margin-left:15px;margin-right:50px;width:100%} #firstPage{margin-top:20%;text-align:center; width:95% !important;border: 1px solid black;page-break-after:always;color:#000;background:#f9f9f9;margin-top:0px;margin-left:15px;margin-right:50px}  body{background-color:#f9f9f9;} .node { background-image:none !important;} .margXero { margin-left:0% !important;  max-width:100% !important;} .WidthZero {width:0% !important;} table#firstPage td {border : 1px solid black !important;padding:4px} table#firstPage th{border:1px solid black !important;font-size: 20px !important;padding: 5px !important;text-align: center !important;} .Wrap{bottom:0;page-break-after:always !important;} #donutChartDiv > bannerHeader {font-size: 14px} #geoChartLegend {font-size: 14px }";


						$scope.pdfClientCustomizations = $scope.getCustomOrCommonData($scope.customDashboardProperties.pdfClientCustomizations, $scope.commonDashboardProperties.pdfClientCustomizations);

						styleCSS += $scope.pdfClientCustomizations[0].css;

						styleCSS += '</style>';

						return styleCSS;
					}

					// This function would be customize the look for particular client. Especially with fitting two graphs on a page which has big or small graphs
					function clientCustomizations() {

						$scope.pdfClientCustomizations = $scope.getCustomOrCommonData($scope.customDashboardProperties.pdfClientCustomizations, $scope.commonDashboardProperties.pdfClientCustomizations);
						for (var i = 1; i < $scope.pdfClientCustomizations.length; i++) {
							//console.log($scope.pdfClientCustomizations[i].graph.before);
							$(abcd).contents().find($scope.pdfClientCustomizations[i].graph.name).before($scope.pdfClientCustomizations[i].graph.before).after($scope.pdfClientCustomizations[i].graph.after);

						}


						return abcd;
					}

					// This function would create page breaks after 2 graphs
					function chartPageBreaks() {
						$(abcd).contents().find('.hp-banner:even').after('<table class="Wrap"><tr><td style="align:center"></td></tr></table>');
						//$(abcd).contents().find('.hp-banner:even').css('page-break-after', 'always');
						//$(abcd).contents().find('.hp-banner:even').css('-webkit-region-break-inside','avoid');						
						$(abcd).contents().find('.hp-banner:last').css('page-break-after', 'auto');
						$(abcd).contents().find('.hp-banner:even').css('margin-top', '3%');
						//$(abcd).contents().find('.hp-banner:even').after('</td></tr></table>');
						return abcd;
					}

					// This function would be used to show the vote counts. By default vote counts are disabled on the site
					function showVoteCounts() {
						$(abcd).contents().find("#MgmtChart").css("display", "none");
						$(abcd).contents().find("#mgmtChartAlignMgmtProposal").css("display", "none");
						$(abcd).contents().find("#ShareChart").css("display", "none");
						$(abcd).contents().find("#shareChartAlignMgmtProposal").css("display", "none");
						$(abcd).contents().find("#MgmtChartPDF").css("display", "block");
						$(abcd).contents().find("#ShareChartPDF").css("display", "block");
						$(abcd).contents().find("#MgmtChart1").css("z-index", "100");
						$(abcd).contents().find(".sectorCount").css("display", "block");
						$(abcd).contents().find("#test1").css("display", "none");
						$(abcd).contents().find("#votingStatisticsPDF").css("display", "block");
						$(abcd).contents().find('#count').css("display", "block");
						$(abcd).contents().find('.meetingTypeNonPDF').css("display", "none");
						$(abcd).contents().find('.meetingTypePDF').css("display", "block");
						$(abcd).contents().find('.marketNonPDF').css("display", "none");
						$(abcd).contents().find('.marketPDF').css("display", "block");
						return abcd;
					}

					//abcd = toggleFullScreen();
					$('#nm').remove();
					//console.log(document.getElementsByClassName("donutLegend").length);
					if (document.getElementsByClassName("donutLegend").length > 0) {
						document.getElementsByClassName("donutLegend")[0].setAttribute("viewBox", "0 1 225 205");
						document.getElementsByClassName("donutLegend")[0].setAttribute("viewBox", "0 1 225 205");

					}

					var abc = $('html');
					var abcd = $(abc).clone();

					abcd = removeFilters(abcd);
					abcd = removeExpandBtn(abcd);

					var styleCSS = cssStyles();

					abcd = mandatoryCustomizations(abcd);
					abcd = clientCustomizations(abcd);
					abcd = chartPageBreaks(abcd);
					abcd = showVoteCounts(abcd);
					abcd = reportingExport(abcd);

					var abcde = $(abcd).html() + styleCSS;

					var form = $(document.createElement('form'));
					$(form).attr("action", "http://vpna-dev-tmc061:8280/vds/testexport/");
					//$(form).attr("action", "/vds/testexport/");
					$(form).attr("method", "POST");
					$(form).attr("id", "nm");

					var input = $("<input>")
						.attr("type", "hidden")
						.attr("name", "url")
						.val(abcde);

					$(form).append($(input));
					form.appendTo(document.body)
					$(form).submit();

				}

				// ============================================== PDF GENERATION SECTION ENDS ====================================================

				//console.log($scope.showfundfamily);
				//$scope.showFundFamily = true;
				// $scope.showfundfamily = true;
				$scope.showMarket = true;
				$scope.URLFundFamily = false;
				$scope.ValidURLFundFamily = false;
				$scope.validFundFamily = false;
				$scope.setMeetingPage = 0;
				$scope.debugMode = '';
				if ($routeParams.debug != undefined && $routeParams.debug != '') {
					$scope.debugMode = $routeParams.debug;
				}



				if ($scope.debugMode != '') {
					var tmpParams = $scope.debugMode.split("|");

					for (var j = 0; j < tmpParams.length; j++) {
						subParams = tmpParams[j].split('=');

						if (subParams[0] == 'FundFamily' && subParams[1] != '') {
							$scope.URLFundFamily = subParams[1];
						}
						if (subParams[0] == 'issPdfGenerate' && subParams[1] != '') {
							$scope.isPdfClient = "true";
						}

					}
				}

				$scope.customerPreference = vdsServices.getPreference();
				var isMarketFlag = false;
				if ($scope.customerPreference.SearchFilterColumns != '') {
					var tmpSearchFilterColumns = vdsAppHelper.updateTmpSearchFilterColumnsSignificant($scope.customerPreference.SearchFilterColumns.split("|"));
					for (var j = 0; j < tmpSearchFilterColumns.length; j++) {
						if (tmpSearchFilterColumns[j] == 'market') {
							isMarketFlag = true;
							break;
						}

					}
				}
				//date|market|fundfamily|fund|company -- detail
				//company|ticker|securityID|meetingType|voted -- list	
				
				colMeetingListColumnSort = $scope.customerPreference.MeetingListColumnsSort;
				colMeetingDetailColumnSort = $scope.customerPreference.meetingDetailsColumnsSort;


				if ($scope.CustomerID == 3541) {
					//$scope.customerPreference.MeetingListColumns = 'company|ticker|meetingDate|fund|meetingType|country|voted';
					//$scope.customerPreference.MeetingDetailsColumns = 'item|proposal|proponent|rec|vote|proposalCategory';
					 colMeetingDetailColumnSort = 'item';

				}
				colMeetingListColumnSort = $scope.commonDashboardProperties.columnsMeetingList[colMeetingListColumnSort].Model.name;
				colMeetingDetailColumnSort = $scope.commonDashboardProperties.columnsMeetingDetail[colMeetingDetailColumnSort].Model.name;




				//$scope.customerPreference.MeetingListColumns = 'meetingID|' + $scope.customerPreference.MeetingListColumns + '|' + $scope.commonDashboardProperties.MandatoryColumnsMeetingList;
				var MeetingListColumnsAll = 'meetingID|' + $scope.customerPreference.MeetingListColumns + '|' + $scope.commonDashboardProperties.MandatoryColumnsMeetingList;				
				//MeetingDetailsColumnsForExport = $scope.commonDashboardProperties.MandatoryColumnsMeetingDetailExport + '|' + $scope.customerPreference.MeetingDetailsColumns;
				$scope.customerPreference.MeetingDetailsColumns = 'sequence|' + $scope.customerPreference.MeetingDetailsColumns + '|' + $scope.commonDashboardProperties.MandatoryColumnsMeetingDetail;
				
				//console.log($scope.customerPreference.MeetingListColumns);
				//console.log($scope.customerPreference.MeetingDetailsColumns);

				var MeetingListColumnsArr = $scope.customerPreference.MeetingListColumns.split('|');
				var MeetingListColumnsAllArr = MeetingListColumnsAll.split('|');



				var populateMeetingListColumns = new Array;
				var populateMeetingListColumnNames = new Array;
				for (var j = 0; j < MeetingListColumnsAllArr.length; j++) {
					if(vdsUtility.isEmpty(MeetingListColumnsAllArr[j])) {
						continue;
					}
					/*
					var columnsMeetingList = $scope.getCustomOrCommonData($scope.customDashboardProperties.columnsMeetingList,$scope.commonDashboardProperties.columnsMeetingList);
					var modelData = columnsMeetingList[MeetingListColumnsAllArr[j]].Model;
					var nameData = columnsMeetingList[MeetingListColumnsAllArr[j]].Name;
					*/
					var modelData = $scope.commonDashboardProperties.columnsMeetingList[MeetingListColumnsAllArr[j]].Model;
					var nameData = $scope.commonDashboardProperties.columnsMeetingList[MeetingListColumnsAllArr[j]].Name;
					if (vdsServices.getPreferLanguageProperties()[MeetingListColumnsAllArr[j]] != null && nameData!=="Significant Meeting")
						var nameData = vdsServices.getPreferLanguageProperties()[MeetingListColumnsAllArr[j]];

					if (MeetingListColumnsArr.indexOf(MeetingListColumnsAllArr[j]) != -1) {
						//MeetingListColumnsAllArr[j]].Model["hidden"] = false;
						modelData["hidden"] = false;
					}

					populateMeetingListColumns.push(modelData);
					populateMeetingListColumnNames.push(nameData);
				}
				colModelMeetingList = populateMeetingListColumns;

				//console.log(JSON.stringify(colNamesMeetingList));
				colNamesMeetingList = populateMeetingListColumnNames;

				var parseObj = colModelMeetingList;

				var x;

				for (x in parseObj) {
					if (parseObj[x].formatter != '') {
						parseObj[x].formatter = eval(parseObj[x].formatter);
					}
				}
				colModelMeetingList = parseObj;



				var MeetingDetailColumnsArr = $scope.customerPreference.MeetingDetailsColumns.split('|');

				var populateMeetingDetailColumns = new Array;
				var populateMeetingDetailColumnNames = new Array;


				for (var j = 0; j < MeetingDetailColumnsArr.length; j++) {
					if(vdsUtility.isEmpty(MeetingDetailColumnsArr[j])){
						continue;
					}
					populateMeetingDetailColumns.push($scope.commonDashboardProperties.columnsMeetingDetail[MeetingDetailColumnsArr[j]].Model);
					populateMeetingDetailColumnNames.push($scope.commonDashboardProperties.columnsMeetingDetail[MeetingDetailColumnsArr[j]].Name);

				}

				var parseObj = colModelMeetingDetail;
				var x;


				for (x in parseObj) {
					if (parseObj[x].formatter != '') {
						parseObj[x].formatter = eval(parseObj[x].formatter);

					}
					if (parseObj[x].sorttype != '') {
						parseObj[x].sorttype = eval(parseObj[x].sorttype);
					}
				}

				colModelMeetingDetail = parseObj;



				//console.log(vdsServices.isLiveSite());
				//console.log('getRepoDirectory=>'+vdsServices.getRepoDirectory());

				if (isMarketFlag == true) {

					$scope.showMarket = true;
				}
				else {
					$scope.showMarket = false;
				}



				$scope.getUpdateButtonColor = function(id, event) {
					if ($scope.formDirty === true)
						return '#1a6492';
					else
						return 'grey';
				};
				$scope.dateOptions = {

					formatYear: 'yyyy',
					startingDay: 1,
					showWeeks: false
				};

				$scope.formats = ['yyyy-MM-dd', 'dd-MMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
				$scope.format = $scope.formats[1];

				$scope.datePicker = ['fromDatepicker', 'toDatepicker'];

				$scope.open = function($event) {

					$scope[$event.target.id] = true;

					angular.forEach($scope.datePicker, function(value) {

						if ($event.target.id != value) {
							$scope[value] = false;
						}
					});

					$event.preventDefault();
					$event.stopPropagation();

				};

				$scope.formDirty = false;

				$scope.setDirty = function() {
					$scope.formDirty = true;
				};

				$(function() {


					//$('[data-toggle="tooltip"]').tooltip();   


					//console.log(vdsServices.getBaseURL());
					//console.log('st date=>'+$scope.customerPreference.StartDate);
					//console.log('ed date=>'+$scope.customerPreference.EndDate);
					//console.log('roll date=>'+$scope.customerPreference.RolloverDate);
					//console.log('update freq date=>'+$scope.customerPreference.UpdateFrequencyID);
					if (!vdsUtility.isEmpty($scope.customerPreference.CustomMinDate)) {
						$scope.minDate = vdsUtility.getDateFromString($scope.customerPreference.CustomMinDate);
					}

					// VDS-1174: Removed the checks for UpdateFrequencyIDs as the DB values already set the date preferences.

					//console.log( $scope.customerPreference.StartDate + '  ' + $scope.customerPreference.EndDate);
					var sdStr1 = vdsUtility.getDateFromString($scope.customerPreference.StartDate);
					//console.log($scope.customerPreference.StartDate);
					//sdStr = sdStr.replace(' 00:00:00.0','');
					//	var sdStr = sdStr1.concat(' 00:00:00');

					if ($scope.customerPreference.FutureMeetingYN == 1) {
						$scope.customerPreference.EndDate = '3000-01-01';
						var edStr1 = vdsUtility.getDateFromString($scope.customerPreference.EndDate);

						$('#toDatepicker').html('')

					}
					else {
						var edStr1 = vdsUtility.getDateFromString($scope.customerPreference.EndDate);
					}




					//edStr = edStr.replace(' 00:00:00.0','');
					//	var edStr = edStr1.concat(' 00:00:00');

					//console.log(sdStr1 + '  ' + edStr1);
					$scope.searchCriteria = {};
					$scope.filterSummary = {
						fromDate: '', toDate: '', countryList: '', fundFamilyList: '', fundList: '',
						companyOrTicker: { searchParam: '', show: false }
					};


					$scope.parent = { fromDate: '', todate: '' };

					//	console.log(sdStr + edStr);
					//@TODO : this dosent work in IE

					$scope.parent.fromDate = $scope.minDate = new Date(sdStr1.getTime());

					// =================== Changing min date on by default section Starts ===========================

					if (!vdsUtility.isEmpty($scope.customerPreference.CustomMinDate)) {

						$scope.minDate = vdsUtility.getDateFromString($scope.customerPreference.CustomMinDate);
					}

					// =================== Changing min date by default section ends ===========================

					if ($scope.customerPreference.FutureMeetingYN == 1) {
						$scope.maxDate = new Date(edStr1.getTime());
						//var tmpToday = new Date();						
						//$scope.parent.toDate = new Date(tmpToday.getTime() + tmpToday.getTimezoneOffset() * 60000);
						$scope.parent.toDate = '';
					}
					else {
						$scope.parent.toDate = $scope.maxDate = new Date(edStr1.getTime());
					}



					//console.log(sdStr+'='+edStr);

					//  $scope.parent.fromDate = new Date($scope.minDate.getTime() + $scope.minDate.getTimezoneOffset() * 60000);
					// $scope.parent.toDate = new Date($scope.maxDate.getTime() + $scope.maxDate.getTimezoneOffset() * 60000);
					// $scope.parent.fromDate = $filter('date')(sdStr, $scope.formats[1]); //$scope.customerPreference.StartDate;
					// $scope.parent.toDate = $filter('date')(edStr, $scope.formats[1]); //$scope.customerPreference.EndDate;
					// $scope.parent.toDate = $scope.customerPreference.EndDate;

					//  $scope.maxDate: edDateObj,
					//  $scope.minDate: stDateObj


					/*      $("#fromDatepicker").datepicker({
	  
							  dateFormat: "yy-mm-dd",
							  maxDate: edDateObj,
							  minDate: stDateObj
						  	
						  }).datepicker("setDate", $scope.customerPreference.StartDate);
	  
						  $("#toDatepicker").datepicker({
	  
							  dateFormat: "yy-mm-dd",
							  maxDate: edDateObj,
							  minDate: stDateObj
						  }).datepicker("setDate", $scope.customerPreference.EndDate);
					  	
						  */
					/*
					
					$("#fromDatepicker").datepicker({

		                defaultDate: stDateObj,
						dateFormat: "yy-mm-dd",
						maxDate: edDateObj,
						mindDate: stDateObj
						
		            });

		            $("#toDatepicker").datepicker({

		                defaultDate: edDateObj,
						dateFormat: "yy-mm-dd",
						maxDate: edDateObj,
						mindDate: stDateObj
						
		            });
					*/

					//$('.selectpicker').selectpicker();					



				});

				//@TODO : fundlist should be polulated from the JSON
				//$scope.fundList = $scope.customerPreference.fundList;


				$scope.fundList = vdsServices.getFundData();
				$scope.fundFamilyList = [];
				$scope.ffundFamilyList = {};


				var t = 0;
				var ffList = [];
				var ffIDList = [];
				$scope.fundFamilies = [];
				var fundFam = [];


				angular.forEach($scope.fundList, function(value) {

					//$scope.fundFamilyList[value.FundFamilyID] = value.FundFamilyName;
					//$scope.fundFamilyList[value.FundFamilyID][value.fundID] = value.fundName;												
					//$scope.fundFamilyList['FundFamilyID'] = value.FundFamilyID;					
					//$scope.fundFamilyList['FundFamilyName'] = value.FundFamilyName;						
					//var child = [{ }];						
					if (ffList.indexOf(value.FundFamilyName) == -1 && value.FundFamilyName != null) {
						ffList.push(value.FundFamilyName);
						ffIDList.push(value.FundFamilyID);
						//console.log('fff=>'+value.FundFamilyName);
						$scope.fundFamilyList[t] = { 'FundFamilyID': value.FundFamilyID, 'FundFamilyName': value.FundFamilyName };

						t++;


					}




					//$scope.fundFamilies = {value.FundFamilyID:{'fundID':value.fundID,'fundName':value.fundName}};

					//fundFam[k].push = {'fundID':value.fundID,'fundName':value.fundName};
					//child[value.FundFamilyID] = {'fundID':value.fundID,'fundName':value.fundName}

					//$scope.fundFamilies[value.FundFamilyID] = value.fundID;


					//$scope.ffundFamilyList[value.FundFamilyID]['fundID'] = value.fundID;					
					//$scope.ffundFamilyList[value.FundFamilyID]['fundName'] = value.fundName;

					//ffl.push(x);
					//fundFam.push(child)

				});


				/*
				angular.forEach($scope.fundList, function(value) {
					
					value.FundFamilyID = value.FundFamilyID.toString();
					value.fundID = value.fundID.toString();
				});
				*/

				//$scope.fundFamilyList = ffl;
				//var x = $scope.fundFamilies;

				//console.log( 'fundFamilies=>'+JSON.stringify(x));
				//$scope.fundFamilyList = [$scope.fundFamilyList];					

				//console.log( 'fund list1=>'+$scope.fundList[0]['fundID']);
				//console.log( 'fund list2=>'+vdsServices.getFundData()[0]['fundID']);
				//  console.log( 'fund list family=>'+JSON.stringify($scope.fundFamilyList));
				//  console.log( 'fund list family count=>'+ffList.length);
				//  console.log( 'funds=>'+JSON.stringify($scope.fundList));
				//console.log( 'funds=>'+JSON.stringify(fundFam));
				// console.log( 'funds and family=>'+JSON.stringify($scope.ffundFamilyList));



				//@TODO : should be removed
				// $scope.operatorList = operatorList;

				//  console.log($scope.operatorList);	

		  if(ffList.length >= 1 && $scope.fundfamilyinsearchfilter)	//no valid fundFamilies found
		  {
			  
			  $scope.showfundfamily = true; 		
			  
			  //console.log('fflist 1');				
			  
		  }
				else {
					//$scope.showFundFamily = false;
					
					$scope.showfundfamily = false;
					//console.log('fflist 2');				
				}


				$scope.dateToYYYMMDD = function(dateStr) {	//01-Jan-2015 format

					var tmpDate = dateStr.split("-");
					var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
					for (var j = 0; j < months.length; j++) {
						if (tmpDate[1] == months[j]) {
							tmpDate[1] = months.indexOf(months[j]) + 1;
						}
					}
					if (tmpDate[1] < 10) {
						tmpDate[1] = '0' + tmpDate[1];
					}
					var formattedDate = tmpDate[2] + '-' + tmpDate[1] + '-' + tmpDate[0];
					return formattedDate;
				};

				$scope.getDateValue = function() {
					// $scope.searchCriteria$scope.parent;

					//$scope.parent.fromDate = $filter('date')($scope.parent.fromDate, "yyyy-MM-dd");
					//$scope.parent.toDate = $filter('date')($scope.parent.toDate, "yyyy-MM-dd");
					var sdStr = $scope.parent.fromDate;
					var edStr = $scope.parent.toDate;

					//console.log('before | search ...date value function....'+$scope.searchCriteria.fromDate+'=>'+$scope.searchCriteria.toDate);
					//console.log('before | parent ...date value function....'+$scope.parent.fromDate+'=>'+$scope.parent.toDate);
					if (sdStr == '' || sdStr == undefined) {
						sdStr = $('#fromDatepicker').val();

						var formattedDate = $scope.dateToYYYMMDD(sdStr);

						sdStr = formattedDate;

						var sdStr1 = vdsUtility.getDateFromString(sdStr);
						$scope.parent.fromDate = new Date(sdStr1.getTime());
					}
					if ($('#toDatepicker').val() == '' && $scope.customerPreference.FutureMeetingYN == 1) {
						//$scope.customerPreference.EndDate = '3000-01-01';
						var edStr1 = vdsUtility.getDateFromString('3000-01-01');
						edStr = new Date(edStr1.getTime());
						$scope.parent.toDate = '';

					}
					else {
						if (edStr == '' || edStr == undefined) {
							edStr = $('#toDatepicker').val();


							var formattedDate = $scope.dateToYYYMMDD(edStr);
							edStr = formattedDate;
							var edStr1 = vdsUtility.getDateFromString(edStr);
							$scope.parent.toDate = new Date(edStr1.getTime());
						}
					}


					$scope.searchCriteria.fromDate = $filter('date')(sdStr, "yyyy-MM-dd");
					$scope.searchCriteria.toDate = $filter('date')(edStr, "yyyy-MM-dd");

					//for Filter summary
					$scope.filterSummary.fromDate = $filter('date')(sdStr, $scope.format);
					$scope.filterSummary.toDate = $filter('date')(edStr, $scope.format);

					//console.log('after | search ...date value function....'+$scope.searchCriteria.fromDate+'=>'+$scope.searchCriteria.toDate);
					//console.log('after | parent ...date value function....'+$scope.parent.fromDate+'=>'+$scope.parent.toDate);


				};


				$scope.addDateLeadingZero = function(dateStr) {
					var tmpDate = dateStr.split("-");

					if (tmpDate.length != 3) return dateStr;

					if (tmpDate[0].length == 1) {
						tmpDate[0] = '0' + tmpDate[0];
					}

					//make month in 'Aug' format
					tmpDate[1] = tmpDate[1].toLowerCase();
					tmpDate[1] = tmpDate[1].charAt(0).toUpperCase() + tmpDate[1].slice(1);
					return tmpDate.join('-');
				};


				$scope.doUpdate = function() {
					// VDS-990: - [START]
					if(vdsAppHelper.vdsBodyAjScope !== null) {
						delete vdsAppHelper.vdsBodyAjScope["significantVoteFilter"];
						vdsAppHelper.selectedSignificantOption = vdsAppHelper.vdsBodyAjScope.selectedSignificantOption;	
					}
					// VDS-990: - [END]
					loggerHelperConfig.actionCode = 101;
					$scope.selectedStatisticsGraphList = { name: '', clear: false };
					$scope.selectedManagementGraphList = { name: '', clear: false };
					$scope.selectedProposalGraphList = { name: '', clear: false };
					$scope.selectedAlignMgmtProposalGraphList = { name: '', clear: false };
					$scope.selectedMarketGraphList = { name: '', clear: false };
					$scope.selectedMeetingTypeGraphList = { name: '', clear: false };
					$scope.selectedSectorGraphList = { name: '', clear: false };

					$scope.searchCriteria.countryListValue = $('#countrySelect').val();
					if ($('#fromDatepicker').val() != '') {
						var tmpFrom = $scope.addDateLeadingZero($('#fromDatepicker').val());
						$('#fromDatepicker').val(tmpFrom);
					}
					if ($('#toDatepicker').val() != '') {
						var tmpTo = $scope.addDateLeadingZero($('#toDatepicker').val());
						$('#toDatepicker').val(tmpTo);
					}

					//console.log("Update button clicked");
					//console.log($('#fromDatepicker').val()+"=>"+$('#toDatepicker').val());					

					var formStartDate = $('#fromDatepicker').val();
					var formattedStDate = $scope.dateToYYYMMDD(formStartDate);
					if ($('#toDatepicker').val() == '' && $scope.customerPreference.FutureMeetingYN == 1) {
						var formEndDate = '3000-01-01';
						var formattedEdDate = formEndDate;
					}
					else {
						var formEndDate = $('#toDatepicker').val();
						var formattedEdDate = $scope.dateToYYYMMDD(formEndDate);
					}


					var formStartDateTmp = vdsUtility.getDateFromString(formattedStDate);
					var formEndDateTmp = vdsUtility.getDateFromString(formattedEdDate);

					var formStartDateStr = new Date(formStartDateTmp.getTime());
					var formEndDateStr = new Date(formEndDateTmp.getTime());;

					//console.log('date form entered...'+formStartDateStr+'=>'+formEndDateStr);


					var d1 = Date.parse(formStartDate.replace(/-/g, " ")),
						d2 = Date.parse(formEndDate.replace(/-/g, " "));

					oStdt = vdsServices.getPreference().StartDate;
					oStdt = vdsUtility.getDateFromString(oStdt.replace(' 00:00:00.0', ''));

					oEndt = vdsServices.getPreference().EndDate;
					oEndt = vdsUtility.getDateFromString(oEndt.replace(' 00:00:00.0', ''));

					// =================== Changing min date on UPDATE CLICK section Starts ===========================

					if (!vdsUtility.isEmpty($scope.customerPreference.CustomMinDate)) {
						$scope.minDate = vdsUtility.getDateFromString($scope.customerPreference.CustomMinDate);
					}


					//console.log($scope.minDate.toDate());
					//console.log($scope.minDate.getDate());
					var minMonth = $scope.minDate.getMonth() + 1;
					var minMonthStr = minMonth < 10 ? '0' + minMonth : minMonth;
					var minDate = $scope.minDate.getDate();
					var minDateStr = minDate < 10 ? '0' + minDate : minDate;
					var minDate = $scope.minDate.getFullYear() + '-' + minMonthStr + '-' + minDateStr;

					// =================== Changing min date on UPDATE CLICK section ends ===========================

					sdStr = minDate;
					sdStr = sdStr.replace(' 00:00:00.0', '');

					var sdStr1 = vdsUtility.getDateFromString(sdStr);
					var AllowedStDate = new Date(sdStr1.getTime());


					//
					edStr = vdsServices.getPreference().EndDate;
					edStr = edStr.replace(' 00:00:00.0', '');

					var edStr1 = vdsUtility.getDateFromString(edStr);
					var AllowedEdDate = new Date(edStr1.getTime());


					//console.log('date allowd....'+AllowedStDate+'=>'+AllowedEdDate);


					if (d1 > d2) {
						alert('Meeting Start date cannot be greater than End date');
						return false;
					}
					else if ($scope.customerPreference.FutureMeetingYN == 1 && formStartDate == '') {
						alert('Start Date cannot be left blank');
						return false;
					}
					else if (formStartDate == '' || (formEndDate == '' && $scope.customerPreference.FutureMeetingYN == 0)) {
						alert('Dates cannot be left blank');
						return false;
					}


					else if (formStartDateStr < AllowedStDate) {
						//var allowedStrDate = AllowedStDate.getDate()+'-'+(AllowedStDate.getMonth() + 1)+'-'+AllowedStDate.getFullYear();
						var allowedStrDate = AllowedStDate.getDate() + '-' + (AllowedStDate.getMonth()) + '-' + AllowedStDate.getFullYear();
						allowedStr = $scope.toDDMMMYYYNew(allowedStrDate);
						alert('Meeting Start date cannot be less than ' + allowedStr);
						return false;

					}
					else if (formEndDateStr > AllowedEdDate) {
						//var allowedStrDate = AllowedEdDate.getDate()+'-'+(AllowedEdDate.getMonth() + 1)+'-'+AllowedEdDate.getFullYear();
						var allowedStrDate = AllowedEdDate.getDate() + '-' + (AllowedEdDate.getMonth()) + '-' + AllowedEdDate.getFullYear();
						allowedStr = $scope.toDDMMMYYY(allowedStrDate);
						alert('Meeting End date cannot be greater than ' + allowedStr);
						return false;
					}

					else	//validation passed, so go ahead and process
					{
						//alert('dirty'+$scope.searchForm.$dirty);

						if ($scope.customerPreference.FutureMeetingYN == 1) {
							if ($('#toDatepicker').val() != '') {
								if (!$scope.isDDMMMYYY($('#toDatepicker').val())) {
									alert('Please enter dates in DD-MMM-YYYY format e.g. 01-Jan-2015');
									return false;
								}
							}

							if (!$scope.isDDMMMYYY($('#fromDatepicker').val())) {
								alert('Please enter dates in DD-MMM-YYYY format e.g. 01-Jan-2015');
								return false;

							}

						}
						else {
							if (!$scope.isDDMMMYYY($('#fromDatepicker').val()) || !$scope.isDDMMMYYY($('#toDatepicker').val())) {
								alert('Please enter dates in DD-MMM-YYYY format e.g. 01-Jan-2015');
								return false;
							}
						}

						if ($scope.checkQueryStringSpecialChars($('.companyOrTickerClass').val()))	//check for special characters in company search field
						{
							alert('Company name may not contain any of the following characters: !#<>?%{}');
							return false;
						}


						if ($scope.formDirty == true) {
							$scope.formDirty = false;
							//console.log('form changed.Make service call');

							$("#meetingDisplayGrid").appendTo("#tempGrid");
							$("#meetingDisplayGrid").css("display", "none");

							$("#onlyTableGrid").appendTo("#tempGrid");
							$("#onlyTableGrid").css("display", "none");

							$("#meetingListGrid").appendTo("#tempGrid");
							$("#meetingListGrid").css("display", "none");
							//$("#list").jqGrid('GridUnload');	//unload meeting list


							$scope.getDateValue();


							$scope.parent.fromDate = formStartDateStr;
							if ($('#toDatepicker').val() == '' && $scope.customerPreference.FutureMeetingYN == 1) {
								$scope.parent.toDate = '';
							}
							else {
								$scope.parent.toDate = formEndDateStr;
							}
							//console.log('after meeting');	

							angular.element($('#tilesDiv')).empty();
							//$("#fromDatepicker,#toDatepicker,.fundSelectClass,#fundFamilySelect,.companyOrTickerClass").attr('disabled','disabled');							

							if ($scope.debugMode == 'old') {
								$scope.getData();	//original graph call 								
							}
							else {
								//$scope.getGraphsData();	//new graph call 

								if ($scope.siteFormat == 'dashboard') // only call graphs if site format is dashboard
								{
									$scope.getGraphsData();	//new graph call 

								}
								else {
									$scope.dashboardData = 0;	//set dashboardData for live site
								}

							}
							$scope.getMeetingList();	//	

							$scope.$watch('showDashboard', function() {
								if ($scope.showDashboard == true)
									$(".datepickerClass,#fromDatepicker,#toDatepicker,.fundSelectClass,#fundFamilySelect,.companyOrTickerClass,.selectSignificantMeetings").removeAttr('disabled');
							});


							$("#resetMeetingListfilter").hide();	//hide this div in meetinglist section
							//console.log('after data');


							//$scope.searchForm.$dirty = false;
						}
						else {
							$scope.formDirty = false;
							return false;
						}
					}


				};

				// Month starting from 0
				$scope.toDDMMMYYYNew = function(dateStr) {


					if (dateStr == '') return false;


					var tmpDate = dateStr.split("-");
					var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
					for (var j = 0; j <= months.length; j++) {
						if (tmpDate[1] == j) {
							tmpDate[1] = months[j];
						}
					}
					if (tmpDate[0].length == 1) {
						tmpDate[0] = '0' + tmpDate[0];
					}
					return tmpDate[0] + '-' + tmpDate[1] + '-' + tmpDate[2];

				};

				$scope.toDDMMMYYY = function(dateStr) {


					if (dateStr == '') return false;


					var tmpDate = dateStr.split("-");
					var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
					for (var j = 1; j <= months.length; j++) {
						if (tmpDate[1] == j) {
							tmpDate[1] = months[j];
						}
					}
					if (tmpDate[0].length == 1) {
						tmpDate[0] = '0' + tmpDate[0];
					}
					return tmpDate[0] + '-' + tmpDate[1] + '-' + tmpDate[2];

				};

				$scope.isDDMMMYYY = function(currVal) {


					if (currVal == '') return false;

					var tmpDate = currVal.split("-");
					//console.log(tmpDate.length);
					if (tmpDate.length != 3) return false;

					//Declare Regex  
					var rxDatePattern = /^(\d{1,2})(\/|-)([a-zA-Z]{3})(\/|-)(\d{4})$/;

					var dtArray = currVal.match(rxDatePattern); // is format OK?

					if (dtArray == null) return false;

					var dtDay = parseInt(dtArray[1]);
					var dtMonth = dtArray[3];
					var dtYear = parseInt(dtArray[5]);

					// need to change to lowerCase because switch is
					// case sensitive
					switch (dtMonth.toLowerCase()) {
						case 'jan':
							dtMonth = '01';
							break;
						case 'feb':
							dtMonth = '02';
							break;
						case 'mar':
							dtMonth = '03';
							break;
						case 'apr':
							dtMonth = '04';
							break;
						case 'may':
							dtMonth = '05';
							break;
						case 'jun':
							dtMonth = '06';
							break;
						case 'jul':
							dtMonth = '07';
							break;
						case 'aug':
							dtMonth = '08';
							break;
						case 'sep':
							dtMonth = '09';
							break;
						case 'oct':
							dtMonth = '10';
							break;
						case 'nov':
							dtMonth = '11';
							break;
						case 'dec':
							dtMonth = '12';
							break;
					}

					// convert date to number
					dtMonth = parseInt(dtMonth);

					if (isNaN(dtMonth)) return false;
					else if (dtMonth < 1 || dtMonth > 12) return false;
					else if (dtDay < 1 || dtDay > 31) return false;
					else if ((dtMonth == 4 || dtMonth == 6 || dtMonth == 9 || dtMonth == 11) && dtDay == 31) return false;
					else if (dtMonth == 2) {
						var isleap = (dtYear % 4 == 0 && (dtYear % 100 != 0 || dtYear % 400 == 0));
						if (dtDay > 29 || (dtDay == 29 && !isleap)) return false;
					}

					return true;

				};



				$scope.filteredFunds = function() {
					var filteredFunds = [];

					var e = document.getElementById("fundFamilySelect");
					var strFF = e.options[e.selectedIndex].value;

					if (strFF == '') {
						var selectFundFamily = '';
					}
					else {
						var selectFundFamily = 'number:' + value.FundFamilyID;
					}

					angular.forEach($scope.fundList, function(value) {
						//if(strFF == '' || value.FundFamilyID == $scope.searchCriteria.fundFamilyValue)
						//alert(value.fundName);
						{
							//this.push({'fundName':value.fundName,'fundID':value.fundID,'FundFamilyID':value.FundFamilyID});
							this.push(value);
						}
					}, filteredFunds);
					return filteredFunds;
				};

				$scope.filteredCountries = function() {
					var filteredCountries = [];
					//var e = document.getElementById("FundFamilySelect");
					//var strFF = e.options[e.selectedIndex].value;
					//alert($scope.searchCriteria.fundFamilyValue);
					//console.log($scope.searchCriteria.fundFamilyValue);
					//console.log($scope.URLFundFamily);
					angular.forEach($scope.fundList, function(val, key) {
						if (val.FundFamilyID == $scope.URLFundFamily) {
							$scope.ValidURLFundFamily = val.FundFamilyID;
							$scope.searchCriteria.fundFamilyValue = $scope.ValidURLFundFamily;
							//break;
							//$scope.showFundFamily = false;							
							$scope.showfundfamily = false;
							//	console.log("CHanged");
						}
					});

					//console.log('$scope.searchCriteria.fundFamilyValue=='+$scope.searchCriteria.fundFamilyValue+'=>$scope.ValidURLFundFamily=='+$scope.ValidURLFundFamily);
					angular.forEach($scope.fundList, function(val, key) {
						//console.log(val.FundFamilyID+'=>'+$scope.debugMode+'=>'+val.fundName);


						if ($scope.searchCriteria.fundFamilyValue == null || $scope.searchCriteria.fundFamilyValue == undefined) {
							if ($scope.ValidURLFundFamily != false) {
								//if(val.FundFamilyID == $scope.searchCriteria.fundFamilyValue || $scope.searchCriteria.fundFamilyValue == null || $scope.searchCriteria.fundFamilyValue == undefined)	{	
								if (val.FundFamilyID == $scope.searchCriteria.fundFamilyValue) {
									this.push(val);
								}
							}
							else {

								this.push(val);
							}
						}
						else {
							if (val.FundFamilyID == $scope.searchCriteria.fundFamilyValue) {	//here						  
								this.push(val);
							}
						}


						/*						
						if($scope.debugMode != '' && $scope.debugMode != undefined )
						{
							//console.log('if');
							if(val.FundFamilyID == $scope.debugMode)	{	//here
								this.push(val);
							}
						}
						else
						{
							if(val.FundFamilyID == $scope.searchCriteria.fundFamilyValue || $scope.searchCriteria.fundFamilyValue == null || $scope.searchCriteria.fundFamilyValue == undefined)	{	//here						  
								this.push(val);
						  }
						}
						*/

					}, filteredCountries);
					return filteredCountries;
				};

				var sc = {};
				sc.fromDate = $scope.customerPreference.StartDate;
				sc.toDate = $scope.customerPreference.EndDate;





				vdsServices.getGetCountryList($routeParams.id, sc).$promise.then(function(response) {

					//$(".countryMultiSelectClass").multiselect('disable');					
					var countrystr = '';
					for (x in response.data) {
						var tmpCountry = response.data[x].UniqueCountryList;
						response.data[x].UniqueCountryList = tmpCountry.replace(/[\n\r]+/g, ' ');
						if (countrystr == '') {
							countrystr = response.data[x].UniqueCountryList;
						}
						else {
							countrystr += '||' + response.data[x].UniqueCountryList;
						}
						//console.log(response.data[x].UniqueCountryList);
					}


					$scope.countryMultiSelectTempArr = new Array;
					$scope.countryMultiSelectDefaultArr = new Array;
					$scope.fundMultiSelectTempArr = new Array;
					$scope.fundMultiSelectDefaultArr = new Array;
					$scope.fundFamilyMultiSelectTempArr = new Array;
					$scope.fundFamilyMultiSelectDefaultArr = new Array;

					//$scope.preferenceCountryList = countrystr.split("||");
					setTimeout(function() {
						var cList = [];
						var countryMultiSelectOptions = [];


						var tmpCountryList = countrystr.split("||");
						tmpCountryList.sort();
						for (var j = 0; j < tmpCountryList.length; j++) {

							tmpCountry = tmpCountryList[j];
							if (cList.indexOf(tmpCountry) == -1 && tmpCountry != null) {
								cList.push(tmpCountry);

								$scope.countryList[j] = { 'CountryName': tmpCountry };
								countryMultiSelectOptions.push({ label: tmpCountry, title: tmpCountry, value: tmpCountry, selected: true });
							}
						}

						cList.sort();	//sort country array
						countryMultiSelectOptions.sort(function(a, b) { return (a.title.toLowerCase() > b.title.toLowerCase()) ? 1 : ((b.title.toLowerCase() > a.title.toLowerCase()) ? -1 : 0); }); 	//sorting countries based on name (title)
						$scope.countryMultiSelectArr = cList;
						$scope.countryMultiSelectTempArr = cList;
						$scope.countryMultiSelectDefaultArr = cList;
						countryMultiSelectDefaultArr = cList;




						$(".countryMultiSelectClass").multiselect({
							templates: {
								filter: '<li class="multiselect-item multiselect-filter countryFilterLI"><div class="input-group"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span><input class="form-control multiselect-search countryInputSearch" type="text"></div></li>',
								ul: '<ul class="multiselect-container dropdown-menu countryMultiSelectUL"></ul>'
							},
							buttonClass: 'btn btn-default countryMultiSelectButton',
							enableFiltering: true,
							//filterPlaceholder: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.filterPlaceholder,$scope.commonDashboardProperties.searchFilter.marketFilter.filterPlaceholder),//'Search',
							filterPlaceholder: vdsServices.getPreferLanguageProperties().Search,//'Search',
							includeSelectAllOption: true,
							selectAllValue: 'select-all-country',
							maxHeight: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.maxHeight, $scope.commonDashboardProperties.searchFilter.marketFilter.maxHeight),//200,																					
							enableCaseInsensitiveFiltering: true,
							selectAllText: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.marketFilter.selectAllText),//'All Markets',
							nonSelectedText: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.nonSelectedText, $scope.commonDashboardProperties.searchFilter.marketFilter.nonSelectedText),//'All Markets',
							nSelectedText: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.marketFilter.nSelectedText),//'selected',
							numberDisplayed: 2,
							buttonWidth: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.buttonWidth, $scope.commonDashboardProperties.searchFilter.marketFilter.buttonWidth),//'92%',
							onSelectAll: function() {
								//console.log('onSelectAll triggered.');
							},
							onChange: function(option, checked) {
								$scope.$apply(function() {
									$scope.formDirty = true;
								});




							},
							buttonText: function(options) {
								if ($(".countryMultiSelectClass :selected").length == 0 || ($(".countryMultiSelectClass :selected").length == $(".countryMultiSelectClass option").length)) {
									//return 'All Markets';
									return $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.marketFilter.selectAllText);
								}
								else if ($(".countryMultiSelectClass :selected").length === 1) {
									var labels = [];
									//var buttonStringLength = 20;
									var buttonStringLength = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.buttonStringLength, $scope.commonDashboardProperties.searchFilter.marketFilter.buttonStringLength);
									options.each(function() {
										if ($(this).attr('label') !== undefined) {
											var buttonString = $(this).attr('label');
											var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
											labels.push(buttonString);
										}
										else {
											var buttonString = $(this).html();
											var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
											labels.push(buttonString);
										}
									});
									return labels.join(', ') + '';
								}
								else if ($(".countryMultiSelectClass :selected").length > 1) //$("#countryMultiSelect1 :selected").length
								{
									//return options.length + ' selected';
									return options.length + ' ' + $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.marketFilter.nSelectedText);
								}
							}
						});

						// $(".countryMultiSelectClass").multiselect('dataprovider', countryMultiSelectOptions);
						// $('.countryMultiSelectClass').multiselect('disable');
						//$('.countryMultiSelectClass').multiselect('rebuild');

						//$('ul.countryMultiSelectUL').css('width','250px');

						$("input.countryInputSearch").on('input', function() {


							if ($(this).val() != '') {
								var selectThese = new Array;
								/*
								$("ul.countryMultiSelectUL li").each(function() {										
										if($(this).hasClass("multiselect-item") == false)
										{
											if( $(this).css('display') == 'list-item' && !$(this).find('input:checkbox').attr('checked'))
											{
												$(this).find('input:checkbox').attr('checked',true);												
											}											
										}
								});
								*/
								$('ul.countryMultiSelectUL > li:visible > a > label > input').each(function() {
									//selectThese.push($(this).val());									
									$(this).attr('checked', true);
								});

								/*
								$('ul.countryMultiSelectUL > li:visible > a > label > input').each(function() {
									selectThese.push($(this).val());
								});
								console.log('yo here=>'+selectThese);								
								$('.countryMultiSelectClass').val(selectThese);										
								$('.countryMultiSelectClass').multiselect('refresh');
								*/


							}
							else {

								var deselectItems = new Array;
								var selectItems = new Array;
								var di = 0;
								var si = 0;


								$(".countryMultiSelectClass option").each(function() {
									if ($(this).is(':selected')) {
										//console.log('selected=>'+$(this).val());
									}
									else {
										deselectItems[di] = $(this).val();
										di++;
										//console.log('not selected=>'+$(this).val());
									}

								});
								$('.countryMultiSelectClass').multiselect('deselect', deselectItems);
								//$('.countryMultiSelectClass').multiselect('select', selectItems);


								/*
								var selectItems=new Array;
								$('ul.countryMultiSelectUL > li:visible > a > label > input:checked').each(function() {
									
									selectItems.push($(this).val());									
									//$(this).attr('checked',true);
								});
								
								$('.countryMultiSelectClass').val('[""]');
								$('.countryMultiSelectClass').multiselect('select', selectItems);
								*/

							}

						});

						if ($('.countryMultiSelectButton').parent().find('ul.classOkCancel').length == 0) {
							$('.countryMultiSelectButton').parent().append('<ul class="dropdown-menu classOkCancel" id="countryOkCancel" ><li style="float: right;"><button class="btn btn-default buttonCountry" type="button" onClick="submitFilter(this,\'country\');">' + vdsServices.getPreferLanguageProperties().OK + '</button>&nbsp;<button class="btn btn-default buttonCancelCountry" style="margin-right: 10px; " type="button" onClick="cancelFilter(this,\'country\');">' + vdsServices.getPreferLanguageProperties().Cancel + '</button></li></ul>');
						}
						$('.countryMultiSelectUL').scrollTop(0); // scroll options to the top

						//$(".input-group-addon").hide();
						//$(".input-group-btn").removeClass('input-group-btn').html('<button class="btn btn-default" type="button" onClick="submitFilter(this,\'country\');">OK</button>');								

						$(".countryMultiSelectUL").find(".input-group-addon").hide();
						//$(".countryMultiSelectUL").find(".input-group-btn").removeClass('input-group-btn').html('<button class="btn btn-default buttonCountry" disabled type="button" onClick="submitFilter(this,\'country\');">OK</button>');
						$(".countryMultiSelectUL").find(".input-group-btn").hide();

						if (GetIEVersion() == 9)	// IE 9
						{
							$(".countryMultiSelectUL").addClass('IE9Filter');
						}


						$("input.countryInputSearch").addClass('clearable');


						// init plugin (with callback)
						$('.clearable').clearSearch({ callback: function() { } });
						//$('.input.countryInputSearch').clearSearch({ callback: function() {  } } );

						/*
						$(".clear_input").css("z-index", "2500");
						$(".clear_input").css("text-decoration", "none");
						$(".clear_input").css("left", "135px !important");
						 
						$(".clear_input").addClass("clearInputStyleCountry");
						*/

						$("li.countryFilterLI > .input-group > .clear_input_div > a").addClass("clearInputStyleCountry");
						/* 
						$(".clearInputStyleCountry").css("z-index", "2500");
						$(".clearInputStyleCountry").css("text-decoration", "none");
						$(".clearInputStyleCountry").css("left", "135px !important");
						*/
						$(".clearInputStyleCountry").hide();

						//$('.clear_input').click(function () {
						$('.clearInputStyleCountry').click(function() {
							$("input.countryInputSearch").val('');
							//$(".buttonCountry").attr('disabled','disabled');
							$("input.countryInputSearch").trigger("input");
						});

						$("input.countryInputSearch").keyup(function(e) {
							if ($.trim($(this).val()) == '') {
								//$(".buttonCountry").attr('disabled','disabled');
							}
							else {
								$(".buttonCountry").removeAttr('disabled');
								var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
								if (charCode == 13) {
									submitFilter(this, 'country');
								}
							}

						});

						/*
						$("input.countryInputSearch").css('width','220px');
						$("input.countryInputSearch").css('height','30px');
						$("input.countryInputSearch").css('padding-right','30px');
						*/



					}, 250);


				});

				var fList = [];
				var ff_List = [];
				var ffID_List = [];
				var fundMultiSelectOptions = [];
				var fundFamilyMultiSelectOptions = [];

				angular.forEach($scope.fundList, function(value) {
					if (value.FundFamilyID == $scope.URLFundFamily) {
						$scope.ValidURLFundFamily = value.FundFamilyID;
						$scope.searchCriteria.fundFamilyValue = $scope.ValidURLFundFamily;
						//break;
						//$scope.showFundFamily = false;							
						$scope.showfundfamily = false;
						//console.log("CHanged");
					}
				});
				//	console.log($scope.fundfamilyinsearchfilter + "     "  + $scope.showfundfamily);
				
				if ($scope.fundfamilyinsearchfilter) {
					if (!$scope.showfundfamily) {
						//	console.log(columncount);
						columncount = columncount - 1;
					}
				}
				//	console.log(columncount);
				
			//	if($scope.showSignificant){


					if (columncount == 5 ) {
						$('#CompanySearchGroup').removeClass('col-md-3 col-sm-3 col-xs-3').addClass('col-md-2 col-sm-2 col-xs-2');
					}
	
					if(($scope.showfundfamily && !$scope.showfund) || (!$scope.showfundfamily && $scope.showfund) ){
						$('.FundGroup').css({"width": ""});
						
					}
					if ($scope.showfundfamily && $scope.showfund) {
					$('.FundGroup').css({"width": "200%"});
					}

					if (columncount < 4  ) {
						$scope.showUpdate1 = true;
						$('#spinnerDiv').css({"float": "revert"});
					}

					if (columncount == 6  ) {
						
						$('#searchImgBottom').css({"margin-top": "-30px"});
						$('.graphicsFootnote').css({"margin-top":"-25px"});
						$('.graphicsFootnote').css({"margin-left":"37px"});
						//$('#FundSearchBoxLabel').css({"margin-left":"37px"});
						$('.FilterHeadingRow > *').css({"flex":"0 0 30.33%"});
                         
						//$('.FundFilter').attr('style', function(i,s) { return (s || '') + 'padding-left: 39px !important;' });
						$('.FundFilter').attr('style', function(i,s) { return (s || '') });
						$('#CompanyRow .widthFilters').css({"width":"92%"});
						$('label[for="fromDatepicker"]').css({"width":"10%"});
						$('label[for="toDatepicker"]').css({"width":"5%"});
						$('.form-control.inputClass.datepickerClass').attr('style', 'width: 36.3% !important');
						
						}	

					

					// if (columncount == 6) {
					// 	 $('#FundFamilyGroup').removeClass('col-md-2 col-sm-2 col-xs-2').addClass('col-md-3 col-sm-3 col-xs-3');
					// 	// $('#FundGroup').removeClass('form-group col-md-2 col-sm-2 col-xs-2 nopadding').addClass('form-group col-md-3 col-sm-3 col-xs-3 nopadding');
						
					// 	 $('#SignificantGroup').removeClass('col-md-2 col-sm-2 col-xs-2').addClass('col-md-3 col-sm-3 col-xs-3');
						 
					// 	 $('#MarketGroup').removeClass('col-md-2 col-sm-2 col-xs-2').addClass('col-md-3 col-sm-3 col-xs-3');
					// 	 $('#UpdateGroup').css({"margin-left":"auto"});
					// 	 $('#searchImgTop').css({"margin-right": "18px"});
					// 	 $('#spinnerDiv').css({"float": "revert"});

					// }




			/*}else if(!$scope.showSignificant){	
				
				if (columncount > 3) {
					$scope.showUpdate1 = true;
					//$('#showdate').removeClass('col-md-5').addClass('col-md-4');
				}
					if (columncount == 5) {
					//console.log("Change MD");
					$('#MeetingRangeBoxHeader').removeClass('col-md-4 col-sm-4 col-xs-4').addClass('col-md-4 col-sm-4 col-xs-4');
					$('#MarketSearchBoxLabel').removeClass('col-md-2 col-sm-2 col-xs-2').addClass('col-md-2 col-sm-2');
					$('#FundFamilySearchBoxLabel').removeClass('col-md-2 col-sm-2 col-xs-2').addClass('col-md-2 col-sm-2');
					$('#FundSearchBoxLabel').removeClass('col-md-3 col-sm-3 col-xs-3').addClass('col-md-2 col-sm-2');
					$('#CompanySearchBoxLabel').removeClass('col-md-3 col-sm-3 col-xs-3').addClass('col-md-2 col-sm-2');

					$('#MeetingRangeRow').removeClass('col-md-4 col-xs-4').addClass('col-md-4 col-sm-4 col-xs-4');
					$('#MarketRow').removeClass('col-md-2 col-xs-2').addClass('col-md-2 col-sm-2 col-xs-2');
					$('#FundFamilyRow').removeClass('col-md-4 col-xs-4').addClass('col-md-4 col-sm-4 col-xs-4');
					$('#CompanyRow').removeClass('col-md-3 col-xs-3').addClass('col-md-2 col-sm-2 col-xs-4');
					$('#fromDatepicker').removeClass('fromDatepicker').addClass('fromDateAllElements');
					$('#toDatepicker').removeClass('toDatepicker').addClass('toDateAllElements');
				}
				
				
				//console.log($scope.showfundfamily);
				if ($scope.showfundfamily && $scope.showfund) {
					
					$("#FundFamilyRow").addClass("col-md-4 col-sm-4 col-xs-4");
					$('#FundFamilySearchBoxLabel').removeClass('col-md-3 col-sm-3 col-xs-3').addClass('col-md-2 col-sm-2');
					//  $('button.fundMultiSelectButton').addClass('fundMultiSelectButtonWithFund');

					setTimeout(function() {
						$("button.fundMultiSelectButton").addClass('fundMultiSelectButtonWithFund');
						$("button.fundMultiSelectButton").addClass('fundClassWidthAdjustment');
						$("button.fundFamilyMultiSelectButton").addClass('fundClassWidthAdjustment');
					}, 10);

				}
				else {
					//	console.log("2 wala");
					$("#FundFamilyRow").addClass("col-md-3 col-sm-3 col-xs-3");

				} 
			}

			*/
				/*if($scope.showfundfamily == false)
				{
					
					$("#divFundAndFamily").removeClass( "col-md-4 col-sm-4 col-xs-4").addClass( "col-md-3 col-sm-3 col-xs-3" );
				}
				else
				{
					$("#divFundAndFamily").removeClass( "col-md-3 col-sm-3 col-xs-3").addClass( "col-md-4 col-sm-4 col-xs-4" );
				}*/

				angular.forEach($scope.fundList, function(value) {

					//$scope.fundFamilyList[value.FundFamilyID] = value.FundFamilyName;
					//$scope.fundFamilyList[value.FundFamilyID][value.fundID] = value.fundName;												
					//$scope.fundFamilyList['FundFamilyID'] = value.FundFamilyID;					
					//$scope.fundFamilyList['FundFamilyName'] = value.FundFamilyName;						
					//var child = [{ }];
					value.fundName = decodeHtml($.trim(value.fundName));
					value.FundFamilyName = decodeHtml($.trim(value.FundFamilyName));
					if ($scope.showfundfamily == false) {
						if (value.FundFamilyID == $scope.ValidURLFundFamily || $scope.ValidURLFundFamily == false) {
							if (value.fundName != null) {

								fList.push(value.fundName);
								if (value.FileName != null && value.FileName != '') {
									var fundFileName = '../repo/441/policies/' + value.FileName;
									var fundText = value.fundName + '<a href="' + fundFileName + '" target=\'_blank\' style="text-decoration: none; color: #C90101;">&nbsp;<img style="width:10%;vertical-align: top;" src="../repo/441/img/pdf.png"></a>';
								}
								else {
									var fundText = value.fundName;
								}
								fundMultiSelectOptions.push({ label: fundText, title: value.fundName, value: value.fundID, selected: true });
							}

							if (ffID_List.indexOf(value.FundFamilyID) == -1 && value.FundFamilyName != '') {
								ffID_List.push(value.FundFamilyID);
								fundFamilyMultiSelectOptions.push({ label: value.FundFamilyName, title: value.FundFamilyName, value: value.FundFamilyID, selected: true });
							}
						}

					}
					else {
						if (value.fundName != null) {
							//console.log('2=>'+value.FileName);
							fList.push(value.fundName);
							if (value.FileName != null && value.FileName != '') {
								var fundFileName = '../repo/441/policies/' + value.FileName;
								//var fundText = value.fundName + '<a href="'+value.FileName+'" target=\'_blank\' style="text-decoration: none; color: #C90101;"><span class="icon vds-pdf" style="font-size :16px; color:#C90101; vertical-align: top;"></span></a>';
								var fundText = value.fundName + '<a href="' + fundFileName + '" target=\'_blank\' style="text-decoration: none; color: #C90101;">&nbsp;<img style="width:10%;vertical-align: top;" src="../repo/441/img/pdf.png"></a>';

							}
							else {
								var fundText = value.fundName;
							}

							fundMultiSelectOptions.push({ label: fundText, title: value.fundName, value: value.fundID, selected: true });
						}

						if (ffID_List.indexOf(value.FundFamilyID) == -1 && value.FundFamilyName != '') {
							ffID_List.push(value.FundFamilyID);
							fundFamilyMultiSelectOptions.push({ label: value.FundFamilyName, title: value.FundFamilyName, value: value.FundFamilyID, selected: true });
						}

					}

				});

				ff_List.sort();	//sort fund family array
				fList.sort();	//sort fund array

				fundFamilyMultiSelectOptions.sort(function(a, b) { return (a.title.toLowerCase() > b.title.toLowerCase()) ? 1 : ((b.title.toLowerCase() > a.title.toLowerCase()) ? -1 : 0); }); 	//sorting fund families based on name (title)

				fundMultiSelectOptions.sort(function(a, b) { return (a.title.toLowerCase() > b.title.toLowerCase()) ? 1 : ((b.title.toLowerCase() > a.title.toLowerCase()) ? -1 : 0); }); 	//sorting funds based on name (title)


				$scope.fundMultiSelectArr = fList;
				$scope.fundMultiSelectTempArr = fList;
				$scope.fundMultiSelectDefaultArr = fList;
				fundMultiSelectDefaultArr = fList;

				$scope.fundFamilyMultiSelectArr = ff_List;
				$scope.fundFamilyMultiSelectTempArr = ff_List;
				$scope.fundFamilyMultiSelectDefaultArr = ff_List;
				fundFamilyMultiSelectDefaultArr = fList;



				/*var tmpFundList = countrystr.split("||");
				
				 for(var j=0; j < tmpFundList.length;j++)
				 {
					
					tmpFund = tmpFundList[j];
					if(fList.indexOf(tmpFundList) == -1 && tmpFundList != null) {						
						fList.push(tmpFundList);
						
						//$scope.countryList[j] = {'CountryName':tmpFund};
						fundMultiSelectOptions.push({label: tmpFund, title: tmpFund, value: tmpFund, selected: true});
					}
				 }
				 */

				$(".fundFamilyMultiSelectClass").multiselect({
					templates: {
						//filter: '<li class="multiselect-item multiselect-filter fundFamilyFilterLI"><div class="input-group"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span><input class="form-control multiselect-search fundFamilyInputSearch" type="text"></div></li>',
						filter: '<li class="multiselect-item multiselect-filter fundFamilyFilterLI"><div class="input-group"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span><input class="form-control multiselect-search fundFamilyInputSearch" type="text"></div></li>',
						ul: '<ul class="multiselect-container dropdown-menu fundFamilyMultiSelectUL"></ul>'

					},
					buttonClass: 'btn btn-default fundFamilyMultiSelectButton',
					enableFiltering: true,
					enableHTML: true,
					//filterPlaceholder: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.filterPlaceholder,$scope.commonDashboardProperties.searchFilter.fundFamilyFilter.filterPlaceholder),//'Search',
					filterPlaceholder: vdsServices.getPreferLanguageProperties().Search,//'Search',	
					includeSelectAllOption: true,
					selectAllValue: 'select-all-fundfamily',
					maxHeight: 200,
					enableCaseInsensitiveFiltering: true,
					selectAllText: vdsServices.getPreferLanguageProperties().AllFundFamiliesText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.selectAllText):vdsServices.getPreferLanguageProperties().AllFundFamiliesText,//'All Fund Families',
					nonSelectedText: vdsServices.getPreferLanguageProperties().AllFundFamiliesText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.nonSelectedText, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.nonSelectedText):vdsServices.getPreferLanguageProperties().AllFundFamiliesText,//'All Fund Families',
					nSelectedText: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.nSelectedText),//'selected',
					//numberDisplayed: 2,
					buttonContainer: '<div class="btn-group btnGroupFilter" />',
					// buttonWidth: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.buttonWidth,$scope.commonDashboardProperties.searchFilter.fundFamilyFilter.buttonWidth),//'46%',

					buttonWidth: function() {
						//	console.log($scope.showfund);					
						if ($scope.showfund == false || $scope.showfund == undefined) {
							//		console.log('return 94%');
							return $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.buttonWidth2, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.buttonWidth2);
						}
						else {
							//		console.log('return 46%');

							//return '46%';
							return $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.buttonWidth, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.buttonWidth);
						}


					},


					onChange: function(option, checked) {
						if ($scope.showfundfamily == true) {
							loadFundsFromFamily($scope);
						}

						$scope.$apply(function() {
							$scope.formDirty = true;
						});

						if ($("input.fundFamilyInputSearch").val() != '') {
							var selectme = new Array;
							$('.fundFamilyMultiSelectUL' + ' > li:visible > a > label > input:checked').each(function() {
								if ($(this).attr('value') != 'select-all-country' && $(this).attr('value') != 'select-all-fund' && $(this).attr('value') != 'select-all-fundfamily')
									selectme.push($(this).attr('value'));
							});

							$('.fundFamilyMultiSelectClass').val('[""]');
							$(".fundFamilyMultiSelectClass").val(selectme);
							$('.fundFamilyMultiSelectClass').multiselect('refresh');
							$scope.fundFamilyMultiSelectTempArr = selectme;
						}
						else {
							var selectme = new Array;
							$('.fundFamilyMultiSelectUL' + ' > li:visible > a > label > input:checked').each(function() {
								if ($(this).attr('value') != 'select-all-country' && $(this).attr('value') != 'select-all-fund' && $(this).attr('value') != 'select-all-fundfamily')
									selectme.push($(this).attr('value'));
							});
							$scope.fundFamilyMultiSelectTempArr = selectme;
						}

					},
					buttonText: function(options) {
						if ($(".fundFamilyMultiSelectClass :selected").length == 0 || ($(".fundFamilyMultiSelectClass :selected").length == $(".fundFamilyMultiSelectClass option").length)) {
							//return 'All Fund Families';
							return vdsServices.getPreferLanguageProperties().AllFundFamiliesText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.selectAllText):vdsServices.getPreferLanguageProperties().AllFundFamiliesText;
						}
						else if ($(".fundFamilyMultiSelectClass :selected").length === 1) {
							var labels = [];
							//var buttonStringLength = 20;
							var buttonStringLength = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.buttonStringLength, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.buttonStringLength);
							options.each(function() {
								if ($(this).attr('label') !== undefined) {
									var buttonString = $(this).attr('label');
									var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
									labels.push(buttonString);
								}
								else {
									var buttonString = $(this).html();
									var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
									labels.push(buttonString);
								}
							});
							return labels.join(', ') + '';
						}
						else if ($(".fundFamilyMultiSelectClass :selected").length > 1) {
							//return options.length + ' selected';
							return options.length + ' ' + $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.nSelectedText);
						}
					}
				});

				$(".fundFamilyMultiSelectClass").multiselect('dataprovider', fundFamilyMultiSelectOptions);
				$('.fundFamilyMultiSelectClass').multiselect('disable');

				$('.fundFamilyMultiSelectClass').change(function() {
					$scope.$apply(function() {
						$scope.formDirty = true;
					});
				});

				//$('ul.fundFamilyMultiSelectUL').css('width','250px');

				$("input.fundFamilyInputSearch").on('input', function() {
					if ($(this).val() != '') {
						$("ul.fundFamilyMultiSelectUL li").each(function() {
							if ($(this).hasClass("multiselect-item") == false) {
								if ($(this).css('display') == 'list-item' && !$(this).find('input:checkbox').attr('checked')) {
									$(this).find('input:checkbox').attr('checked', true);
								}
							}
						});

					}
					else {

						var deselectItems = new Array;
						var selectItems = new Array;
						var di = 0;
						var si = 0;


						$(".fundFamilyMultiSelectClass option").each(function() {
							if ($(this).is(':selected')) {
								//console.log('selected=>'+$(this).val());
							}
							else {
								deselectItems[di] = $(this).val();
								di++;
								//console.log('not selected=>'+$(this).val());
							}

						});
						$('.fundFamilyMultiSelectClass').multiselect('deselect', deselectItems);
						//$('.fundFamilyMultiSelectClass').multiselect('select', selectItems);
					}
				});


				$("input.fundFamilyInputSearch").keyup(function(e) {

					if ($.trim($(this).val()) == '') {
						//$(".buttonFundFamily").attr('disabled','disabled');
					}
					else {
						$(".buttonFundFamily").removeAttr('disabled');
						var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
						if (charCode == 13) {
							submitFilter(this, 'fundfamily');
						}
					}
				});

				if ($('.fundFamilyMultiSelectButton').parent().find('ul.classOkCancel').length == 0) {
					$('.fundFamilyMultiSelectButton').parent().append('<ul class="dropdown-menu classOkCancel" id="fundFamilyOkCancel" ><li style="float: right;"><button class="btn btn-default buttonCancelFundFamily" type="button" onClick="submitFilter(this,\'fundfamily\');">' + vdsServices.getPreferLanguageProperties().OK + '</button>&nbsp;<button class="btn btn-default buttonCancelFundFamily" style="margin-right: 10px; " type="button" onClick="cancelFilter(this,\'fundfamily\');">' + vdsServices.getPreferLanguageProperties().Cancel + '</button></li></ul>');
				}


				$(".fundFamilyMultiSelectUL").find(".input-group-addon").hide();
				$(".fundFamilyMultiSelectUL").find(".input-group-btn").hide();


				//console.log('here fundFamilyMultiSelectClass');

				/*
				$("input.fundFamilyInputSearch").css('width','220px');
				$("input.fundFamilyInputSearch").css('height','30px');
				$("input.fundFamilyInputSearch").css('padding-right','30px');
				*/

				if (GetIEVersion() == 9)	// IE 9
				{
					$(".fundFamilyMultiSelectUL").addClass('IE9Filter');
				}

				$("input.fundFamilyInputSearch").addClass('clearable');


				// init plugin (with callback)
				$('.clearable').clearSearch({ callback: function() { } });
				//$('input.fundFamilyInputSearch').clearSearch({ callback: function() {  } } );

				// update value
				//$('.clearable').val('sample value').change();

				// change width
				//$('.clearable').width('200px').change();

				//$(".clear_input").css("z-index", "2500");
				//$(".clear_input").css("text-decoration", "none");
				//$(".clear_input").css("left", "135px !important");

				//$(".clear_input").addClass("clearInputStyleFundFamily");

				$("li.fundFamilyFilterLI > .input-group > .clear_input_div > a").addClass("clearInputStyleFundFamily");
				/*
				$(".clearInputStyleFundFamily").css("z-index", "2500");
				$(".clearInputStyleFundFamily").css("text-decoration", "none");
				$(".clearInputStyleFundFamily").css("left", "135px !important");
				*/

				//$('.clear_input').click(function () {
				$('.clearInputStyleFundFamily').click(function() {
					$("input.fundFamilyInputSearch").val('');
					//$(".buttonFundFamily").attr('disabled','disabled');
					$("input.fundFamilyInputSearch").trigger("input");
				});





				$(".fundMultiSelectClass").multiselect({
					templates: {
						filter: '<li class="multiselect-item multiselect-filter fundFilterLI"><div class="input-group"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span><input class="form-control multiselect-search fundInputSearch" type="text"></div></li>',
						ul: '<ul class="multiselect-container dropdown-menu fundMultiSelectUL"></ul>'
					},
					// buttonId : 'fundButton',
					buttonClass: 'btn btn-default fundMultiSelectButton',
					enableFiltering: true,
					enableHTML: true,
					//filterPlaceholder: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.filterPlaceholder,$scope.commonDashboardProperties.searchFilter.fundFilter.filterPlaceholder),//'Search',
					filterPlaceholder: vdsServices.getPreferLanguageProperties().Search,//'Search',
					includeSelectAllOption: true,
					selectAllValue: 'select-all-fund',
					maxHeight: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.maxHeight, $scope.commonDashboardProperties.searchFilter.fundFilter.maxHeight),//200,																					
					enableCaseInsensitiveFiltering: true,
					selectAllText: vdsServices.getPreferLanguageProperties().AllFundsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.fundFilter.selectAllText):vdsServices.getPreferLanguageProperties().AllFundsText,//'All Funds',
					nonSelectedText: vdsServices.getPreferLanguageProperties().AllFundsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.nonSelectedText, $scope.commonDashboardProperties.searchFilter.fundFilter.nonSelectedText):vdsServices.getPreferLanguageProperties().AllFundsText,//'All Funds',
					nSelectedText: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.fundFilter.nSelectedText),//'selected',
					numberDisplayed: 2,
					buttonContainer: '<div class="btn-group btnGroupFilter" />',
					buttonWidth: function() {
						//console.log($scope.showfundfamily);					
						if ($scope.showfundfamily == false) {
							//console.log('return 94%');
							return $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.buttonWidth2, $scope.commonDashboardProperties.searchFilter.fundFilter.buttonWidth2);
						}
						else {
							//return '46%';
							return $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.buttonWidth1, $scope.commonDashboardProperties.searchFilter.fundFilter.buttonWidth1);
						}


					},
					onChange: function(option, checked) {
						$scope.$apply(function() {
							$scope.formDirty = true;
						});

						if ($("input.fundInputSearch").val() != '') {
							var selectme = new Array;
							var selectmeVal = [];
							$('.fundMultiSelectUL' + ' > li:visible > a > label > input:checked').each(function() {
								if ($(this).attr('value') != 'select-all-country' && $(this).attr('value') != 'select-all-fund' && $(this).attr('value') != 'select-all-fundfamily') {
									selectme.push($(this).attr('value'));
									selectmeVal.push($(this).parent().attr('title'));
								}
							});

							$('.fundMultiSelectClass').val('[""]');
							$(".fundMultiSelectClass").val(selectme);
							$('.fundMultiSelectClass').multiselect('refresh');
							$scope.fundMultiSelectTempArr = selectme;
							//	console.log('1---'+selectmeVal);
							$("button.fundMultiSelectButton").removeAttr('title');
							setTimeout(function() {
								$("button.fundMultiSelectButton").attr('title', selectmeVal.join(', '));
							}, 500);
						}
						else {
							var selectme = new Array;
							var selectmeVal = [];
							$('.fundMultiSelectUL' + ' > li:visible > a > label > input:checked').each(function() {
								if ($(this).attr('value') != 'select-all-country' && $(this).attr('value') != 'select-all-fund' && $(this).attr('value') != 'select-all-fundfamily') {
									selectme.push($(this).attr('value'));
									selectmeVal.push($(this).parent().attr('title'));
								}

							});

							setTimeout(function() {
								$("button.fundMultiSelectButton").attr('title', selectmeVal.join(', '));
							}, 500);
							$scope.fundMultiSelectTempArr = selectme;

						}

					},
					buttonText: function(options) {
						if ($(".fundMultiSelectClass :selected").length == 0 || ($(".fundMultiSelectClass :selected").length == $(".fundMultiSelectClass option").length)) {
							//return 'All Funds';
							return vdsServices.getPreferLanguageProperties().AllFundsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.fundFilter.selectAllText):vdsServices.getPreferLanguageProperties().AllFundsText;
						}
						else if ($(".fundMultiSelectClass :selected").length === 1) {
							var labels = [];
							if ($scope.showfundfamily == false) {
								//var buttonStringLength = 32;
								var buttonStringLength = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.buttonStringLength2, $scope.commonDashboardProperties.searchFilter.fundFilter.buttonStringLength2);
							}
							else {
								//var buttonStringLength = 20;
								var buttonStringLength = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.buttonStringLength1, $scope.commonDashboardProperties.searchFilter.fundFilter.buttonStringLength1);
							}
							options.each(function() {
								if ($(this).attr('label') !== undefined) {
									var buttonString = $(this).attr('label');
									var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
									labels.push(buttonString);
								}
								else {
									var buttonString = $(this).html();
									var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
									labels.push(buttonString);
								}
							});
							return labels.join(', ') + '';
						}
						else if ($(".fundMultiSelectClass :selected").length > 1) //$("#countryMultiSelect1 :selected").length
						{
							//return options.length + ' selected';
							return options.length + ' ' + $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.fundFilter.nSelectedText);
						}
					}
				});

				$(".fundMultiSelectClass").multiselect('dataprovider', fundMultiSelectOptions);
				$('.fundMultiSelectClass').multiselect('disable');

				$('.fundMultiSelectClass').change(function() {
					$scope.$apply(function() {
						$scope.formDirty = true;
					});
				});
				/*
				if ( $scope.showFundFamily == false)
					$('ul.fundMultiSelectUL').css('width','100%');
				else
					$('ul.fundMultiSelectUL').css('width','250px');
				*/

				/*				
				$("input.fundInputSearch").on('input', function() {					
					if($(this).val() != '')
					{
						
						$("ul.fundMultiSelectUL li").each(function() {										
								if($(this).hasClass("multiselect-item") == false)
								{
									if( $(this).css('display') == 'list-item' && !$(this).find('input:checkbox').attr('checked'))
									{
										$(this).find('input:checkbox').attr('checked',true);				
									}
								}
						});
						
						console.log('fundInputSearch mein');
						$('ul.fundMultiSelectUL > li:visible > a > label > input').each(function() {
									//selectThese.push($(this).val());
									//console.log('yes here');
									$(this).attr('checked',true);
						});
					}
					else
					{
						
						var deselectItems=new Array;
						var selectItems=new Array;
						var di = 0;
						var si = 0;
						
						
						$(".fundMultiSelectClass option").each(function() {									
							if($(this).is(':selected'))
							{										
								//console.log('selected=>'+$(this).val());
							}
							else
							{
								deselectItems[di] = $(this).val();
								di++;
								//console.log('not selected=>'+$(this).val());
							}
							
						});	
						$('.fundMultiSelectClass').multiselect('deselect', deselectItems);	
						//$('.fundMultiSelectClass').multiselect('select', selectItems);
					}
				});
				*/


				//
				if ($('.fundMultiSelectButton').parent().find('ul.classOkCancel').length == 0) {
					$('.fundMultiSelectButton').parent().append('<ul class="dropdown-menu classOkCancel" id="fundOkCancel" ><li style="float: right;"><button class="btn btn-default buttonFund" type="button" onClick="submitFilter(this,\'fund\');">' + vdsServices.getPreferLanguageProperties().OK + '</button>&nbsp;<button class="btn btn-default buttonCancelFund" style="margin-right: 10px; " type="button" onClick="cancelFilter(this,\'fund\');">' + vdsServices.getPreferLanguageProperties().Cancel + '</button></li></ul>');
				}


				$(".fundMultiSelectUL").find(".input-group-addon").hide();
				$(".fundMultiSelectUL").find(".input-group-btn").hide();

				$('.fundMultiSelectUL').scrollTop(0); // scroll options to the top


				/*
				$("input.fundInputSearch").css('width','220px');
				$("input.fundInputSearch").css('height','30px');
				$("input.fundInputSearch").css('padding-right','30px');
				*/
				//

				if (GetIEVersion() == 9)	// IE 9
				{
					$(".fundMultiSelectUL").addClass('IE9Filter');
				}

				$("input.fundInputSearch").addClass('clearable');


				// init plugin (with callback)
				$('.clearable').clearSearch({ callback: function() { } });
				//$('input.fundInputSearch').clearSearch({ callback: function() {  } } );


				//$(".clear_input").addClass("clearInputStyleFund");


				//$('input.fundFamilyInputSearch').clearSearch({ callback: function() {  } } );

				// update value
				//$('.clearable').val('sample value').change();

				// change width
				//$('.clearable').width('200px').change();

				//$(".clear_input").css("z-index", "2500");
				//$(".clear_input").css("text-decoration", "none");
				//$(".clear_input").css("left", "135px !important");



				$("li.fundFilterLI > .input-group > .clear_input_div > a").addClass("clearInputStyleFund");
				/*
				$(".clearInputStyleFund").css("z-index", "2500");
				$(".clearInputStyleFund").css("text-decoration", "none");
				$(".clearInputStyleFund").css("left", "135px !important"); 
				*/
				$(".clearInputStyleFund").hide();


				$('.clearInputStyleFund').click(function() {
					$("input.fundInputSearch").val('');
					//$(".buttonFund").attr('disabled','disabled');
					$("input.fundInputSearch").trigger("input");
				});


				$("button.fundMultiSelectButton").attr('title', fundMultiSelectDefaultArr.join(', '));

				/*
				$("input.fundInputSearch").keyup(function(e){
						console.log('f here');
						if($.trim($(this).val()) == '')
						{
							//$(".buttonFund").attr('disabled','disabled');
						}
						else
						{
							$(".buttonFund").removeAttr('disabled');
							var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
							if(charCode == 13)
							{
								submitFilter(this,'fund');
							}
						}
						
				});
				
				*/



				$scope.countryList = [];
				var cList = [];
				var countryMultiSelectOptions = [];
				if ($scope.customerPreference.UniqueCountryList != '' && $scope.customerPreference.UniqueCountryList != null) {
					$scope.preferenceCountryList = $scope.customerPreference.UniqueCountryList.split("||");
				}
				else	//if no countries found, this usually happens when market filter is not enabled in DB (Table : vdscustomerpreferences Table, column : SearchFilterColumns)
				{
					$scope.preferenceCountryList = new Array;
				}
				var tmpCountryList = $scope.preferenceCountryList;
				for (var j = 0; j < tmpCountryList.length; j++) {

					tmpCountry = vdsAppHelper.getLangProperty(tmpCountryList[j]);
					if (cList.indexOf(tmpCountry) == -1 && tmpCountry != null) {
						cList.push(tmpCountry);
						if (tmpCountryList[j] != "Unknown") {
							$scope.countryList[j] = { 'CountryName': tmpCountry };
							countryMultiSelectOptions.push({ label: tmpCountry, title: tmpCountry, value: tmpCountry, selected: true });
						}
					}
				}

/*				$scope.significantOptionsList = [{
					sid: "All",
					name: "All Meetings"
					}, {
					sid: "Yes",
					name: "Include Significant Meetings Only"
					}, {
					sid: "No",
					name: "Exclude Significant Meetings"
					}];
*/  
		
					$scope.significantOptionsList = $scope.getCustomOrCommonData($scope.customDashboardProperties.significantMeetingOptions,$scope.commonDashboardProperties.significantMeetingOptions);
					//VDS-990: Dynamic dropdowns for Significant meeting filter - [START]
					if(!Array.isArray($scope.significantOptionsList)){
						$scope.significantOptionsList = $scope.significantOptionsList[$scope.customerPreference.SignificantMeetingTypeID];
					}
					//VDS-990: Dynamic dropdowns for Significant meeting filter - [END]
					if( vdsServices.getPreferLanguageProperties().AllMeetingsText !=undefined ){
					  $scope.significantOptionsList[0].name= vdsServices.getPreferLanguageProperties().AllMeetingsText;
					}
          // get Significant Meeting drop down label values from propoerties file.
          if( vdsServices.getPreferLanguageProperties()[$scope.significantOptionsList[1].name] !=undefined ){
					  $scope.significantOptionsList[1].name= vdsServices.getPreferLanguageProperties()[$scope.significantOptionsList[1].name];
					}
          if( vdsServices.getPreferLanguageProperties()[$scope.significantOptionsList[2].name] !=undefined ){
					  $scope.significantOptionsList[2].name= vdsServices.getPreferLanguageProperties()[$scope.significantOptionsList[2].name];
					}

					$scope.selectedSignificantOption = $scope.significantOptionsList[0];
				
						$("#significantID").change(function(event) {
							$.each($(this).find('option'), function(key, value) {
							$(value).removeClass('active');
							})
							$('option:selected').addClass('active');
						});
						
						$("#significantID").tooltip({
							placement: 'bottom',
							trigger: 'hover',
							container: 'body',
							tooltipClass: "tooltipClass",
							title: function(e) {
							return $(this).find('.active').attr('label');
							}
						});
				
						$('.selectSignificantMeetings').change(function() {
							$scope.$apply(function() {
								$scope.formDirty = true;
							});
						});


				$(".countryMultiSelectClass").multiselect({
					templates: {
						filter: '<li class="multiselect-item multiselect-filter countryFilterLI"><div class="input-group"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span><input class="form-control multiselect-search countryInputSearch" type="text"></div></li>',
						ul: '<ul class="multiselect-container dropdown-menu countryMultiSelectUL"></ul>'
					},
					buttonClass: 'btn btn-default countryMultiSelectButton',
					enableFiltering: true,
					//filterPlaceholder: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.filterPlaceholder,$scope.commonDashboardProperties.searchFilter.marketFilter.filterPlaceholder),//'Search',
					filterPlaceholder: vdsServices.getPreferLanguageProperties().Search,//'Search',
					includeSelectAllOption: true,
					selectAllValue: 'select-all-country',
					maxHeight: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.maxHeight, $scope.commonDashboardProperties.searchFilter.marketFilter.maxHeight),//200,																					
					enableCaseInsensitiveFiltering: true,
					selectAllText: vdsServices.getPreferLanguageProperties().AllMarketsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.marketFilter.selectAllText): vdsServices.getPreferLanguageProperties().AllMarketsText,//'All Markets',
					nonSelectedText: vdsServices.getPreferLanguageProperties().AllMarketsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.nonSelectedText, $scope.commonDashboardProperties.searchFilter.marketFilter.nonSelectedText): vdsServices.getPreferLanguageProperties().AllMarketsText,//'All Markets',
					nSelectedText: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.marketFilter.nSelectedText),//'selected',
					numberDisplayed: 2,
					buttonWidth: $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.buttonWidth, $scope.commonDashboardProperties.searchFilter.marketFilter.buttonWidth),//'92%',						
					onChange: function(option, checked) {
						$scope.$apply(function() {
							$scope.formDirty = true;
						});


						if ($("input.countryInputSearch").val() != '') {
							var selectme = new Array;
							$('.countryMultiSelectUL' + ' > li:visible > a > label > input:checked').each(function() {
								if ($(this).attr('value') != 'select-all-country' && $(this).attr('value') != 'select-all-fund' && $(this).attr('value') != 'select-all-fundfamily')
									selectme.push($(this).attr('value'));
							});

							$('.countryMultiSelectClass').val('[""]');
							$(".countryMultiSelectClass").val(selectme);
							$('.countryMultiSelectClass').multiselect('refresh');
							$scope.countryMultiSelectTempArr = selectme;
						}
						else {
							var selectme = new Array;
							$('.countryMultiSelectUL' + ' > li:visible > a > label > input:checked').each(function() {
								if ($(this).attr('value') != 'select-all-country' && $(this).attr('value') != 'select-all-fund' && $(this).attr('value') != 'select-all-fundfamily')
									selectme.push($(this).attr('value'));
							});
							//$(".countryMultiSelectClass").val(selectme);
							$scope.countryMultiSelectTempArr = selectme;
						}

					},
					onSelectAll: function() {
						//console.log('onSelectAll triggered. 1');
					},
					buttonText: function(options) {
						if ($(".countryMultiSelectClass :selected").length == 0 || ($(".countryMultiSelectClass :selected").length == $(".countryMultiSelectClass option").length)) {
							//return 'All Markets';
							return vdsServices.getPreferLanguageProperties().AllMarketsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.marketFilter.selectAllText): vdsServices.getPreferLanguageProperties().AllMarketsText;
						}
						else if ($(".countryMultiSelectClass :selected").length === 1) {
							var labels = [];
							//var buttonStringLength = 20;
							var buttonStringLength = $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.buttonStringLength, $scope.commonDashboardProperties.searchFilter.marketFilter.buttonStringLength);
							options.each(function() {
								if ($(this).attr('label') !== undefined) {
									var buttonString = $(this).attr('label');
									var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
									labels.push(buttonString);
								}
								else {
									var buttonString = $(this).html();
									var buttonString = buttonString.length > buttonStringLength ? buttonString.substring(0, buttonStringLength - 3) + "..." : buttonString;
									labels.push(buttonString);
								}
							});
							return labels.join(', ') + '';
						}
						else if ($(".countryMultiSelectClass :selected").length > 1) //$("#countryMultiSelect1 :selected").length
						{
							//return options.length + ' selected';
							return options.length + ' ' + $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.nSelectedText, $scope.commonDashboardProperties.searchFilter.marketFilter.nSelectedText);
						}
					}
				});
				$(".countryMultiSelectClass").multiselect('dataprovider', countryMultiSelectOptions);
				$('.countryMultiSelectClass').multiselect('disable');


				$('.countryMultiSelectClass').change(function() {
					$scope.$apply(function() {
						$scope.formDirty = true;
					});
				});



				$scope.loadFundsFromFamily = function() {

					//alert(document.getElementById('fundSelect').getAttribute('ng-options'));					
					var e = document.getElementById("fundFamilySelect");
					var strFundFamilySelect = e.options[e.selectedIndex].text;
					//alert('strFundFamilySelect=>'+strFundFamilySelect);
					var x = 0;
					var myfundList = [];

					if (strFundFamilySelect == 'Select') {

						angular.forEach($scope.fundList, function(value) {

							var selectFundFamily = 'number:' + value.FundFamilyID;

							//if(strFF == '' || selectFundFamily == strFF) 
							{

								//console.log('fundName'+value.fundName+'fundID'+value.fundID);
								myfundList[x] = { 'fundName': value.fundName, 'fundID': value.fundID, 'FundFamilyID': value.FundFamilyID };
								x++;
							}
						});

						$scope.$apply(function() {
							$scope.fundList = myfundList;

						});


					}
					else {
						//document.getElementById('fundSelect').setAttribute('ng-options',eval('fund.fundID as fund.fundName for fund in fundList | filter:{FundFamilyID:searchCriteria.fundFamilyValue}');
					}



					/*
					var x=0;
					var myfundList = [];
					
					var e = document.getElementById("FundFamilySelect");
					var strFF = e.options[e.selectedIndex].value;
					
					
					
					
					//alert(strFF+'=>'+selectFundFamily);
					angular.forEach($scope.fundList, function(value) {   

					var selectFundFamily = 'number:'+value.FundFamilyID;
						
						if(strFF == '' || selectFundFamily == strFF) {													
							
							console.log('fundName'+value.fundName+'fundID'+value.fundID);
							myfundList[x] = {'fundName':value.fundName,'fundID':value.fundID,'FundFamilyID':value.FundFamilyID};							
							x++;
						}						
					
					 
					});
					
					console.log(myfundList.length);
					console.log('my:'+JSON.stringify(myfundList));
					*/
					/*
						$scope.$apply(function() {
							$scope.fundList = myfundList;
				
						}); 
					*/

				};



				$scope.doReset = function() {
					//console.log("doReset button clicked");					

					$scope.searchCriteria = {};
					//$scope.parent.fromDate = vdsServices.getPreference().StartDate;					
					//$scope.parent.toDate = vdsServices.getPreference().EndDate;
					var sdStr1 = vdsUtility.getDateFromString(vdsServices.getPreference().StartDate);
					var edStr1 = vdsUtility.getDateFromString(vdsServices.getPreference().EndDate);
					$scope.parent.fromDate = new Date(sdStr1.getTime());
					if ($scope.customerPreference.FutureMeetingYN == 1) {
						$scope.parent.toDate = '';
					}
					else {
						$scope.parent.toDate = new Date(edStr1.getTime());
					}


					$('.countryMultiSelectClass option:not(:checked)').each(function() {
						$(this).prop('selected', true);
					});
					//$('.countryMultiSelectClass').val('[""]');
					$('.countryMultiSelectClass').multiselect('refresh');
					$scope.countryMultiSelectArr = $scope.countryMultiSelectDefaultArr;
					$scope.countryMultiSelectTempArr = $scope.countryMultiSelectDefaultArr;


					$('.fundFamilyMultiSelectClass option:not(:checked)').each(function() {
						$(this).prop('selected', true);
					});

					//$('.fundFamilyMultiSelectClass').val('[""]');
					$('.fundFamilyMultiSelectClass').multiselect('refresh');
					$scope.fundFamilyMultiSelectArr = $scope.fundFamilyMultiSelectDefaultArr;
					$scope.fundFamilyMultiSelectTempArr = $scope.fundFamilyMultiSelectDefaultArr;

					if ($scope.showfundfamily == true) {
						loadFundsFromFamily($scope);
					}

					//$('.fundMultiSelectClass').multiselect('select', fundMultiSelectDefaultArr);
					//$('.fundMultiSelectClass').val(fundMultiSelectDefaultArr);
					//$(".fundMultiSelectClass").multiselect('dataprovider', fundMultiSelectDefaultArr);
					$('.fundMultiSelectClass option:not(:checked)').each(function() {
						$(this).prop('selected', true);
					});
					//$('.fundMultiSelectClass').val('[""]');									
					$('.fundMultiSelectClass').multiselect('refresh');
					$scope.fundMultiSelectArr = $scope.fundMultiSelectDefaultArr;
					$scope.fundMultiSelectTempArr = $scope.fundMultiSelectDefaultArr;

					$("button.fundMultiSelectButton").attr('title', fundMultiSelectDefaultArr.join(', '));

					$("input.multiselect-search").val('');
					$('.clear_input').hide();

					
					$scope.selectedSignificantOption = $scope.significantOptionsList[0];
					//$("#significantID").change(function(event) {
						$.each($("#significantID").find('option'), function(key, value) {
						$(value).removeClass('active');
						})
						//$('option:selected').addClass('active');
					//});
					
					$scope.formDirty = true;
					//console.log('dirtyy'+$scope.formDirty);


				};


				/*   $scope.loadModel = function() {
   
					   return vdsServices.getModel();
				   };
			   */

				$scope.getData = function() {


					$scope.meetingTableData = -1;
					$scope.dashboardData = -1;
					$scope.error.noData = false;
					$scope.showTable.onlyTable = false;

					//$('#spinnerDiv').show();
					$scope.isLoading = true;
					$(".datepickerClass").attr('disabled', 'disabled');
					$(".datepickerClass").attr('disabled', 'disabled');
					$(".fundSelectClass").attr('disabled', 'disabled');
					$("#fundFamilySelect").attr('disabled', 'disabled');
					$(".companyOrTickerClass").attr('disabled', 'disabled');
					$("#generatePdf").attr('disabled', 'disabled');

					//@TODO : change the api call to get only the chart data
					vdsServices.getVDSData($routeParams.id, $scope.searchCriteria).$promise.then(function(response) {



						//console.log("Get Search data service request");
						//console.log("data respose :" + response.meetingTypeUI);
						//console.log("data respose :" + response.data.toSource());
						//console.log('inside=>'+response.data);
						//response.data = '';						


						//console.log($scope.searchCriteria);
						//console.log(LatestSearchCriteria);

						//TODO look at this condition further to match latest ajax request
						if (JSON.stringify(LatestSearchCriteria) === JSON.stringify($scope.searchCriteria)) {
							if (response.data != '' && response.data != null) {
								var response1 = response.data;
								//console.log(response1.toSource());
								var jsonObj = response1;
								var formattedJson = new Object;

								//console.log(json)
								var mc = 0;
								var mm = 0;
								var ip = 0;
								var vs = 0, vsd = 0, vps_s = 0, vps_m = 0;
								var shareHolderMax = '';
								var shareHolderMaxValue = 0;
								var ManagementMax = '';
								var ManagementMaxValue = 0;
								var vcam = 0;
								var x;
								//var votingStatisticsData = {};
								for (x in jsonObj) {


									if (jsonObj[x].OutputType == 'meetingTypeUI') {

										if (mc == 0) {

											formattedJson.meetingTypeUI = new Array;
										}
										formattedJson.meetingTypeUI[mc] = new Object
										//formattedJson.meetingTypeUI[mc].id=jsonObj[x].MeetingType;
										//formattedJson.meetingTypeUI[mc].value=jsonObj[x].MeetingTypeCount;
										formattedJson.meetingTypeUI[mc].id = jsonObj[x].Value1;
										formattedJson.meetingTypeUI[mc].value = parseInt(jsonObj[x].Value2);

										mc++
									}

									if (jsonObj[x].OutputType == 'meetingByMarket') {

										if (mm == 0) {

											formattedJson.meetingByMarket = new Array;
										}
										formattedJson.meetingByMarket[mm] = new Object;
										/*formattedJson.meetingByMarket[mm].CountryId=jsonObj[x].CountryID;
										formattedJson.meetingByMarket[mm].MeetingCount=jsonObj[x].MeetingTypeCount;
										formattedJson.meetingByMarket[mm].CountryName=jsonObj[x].MeetingCountry;
										formattedJson.meetingByMarket[mm].Latitude=jsonObj[x].Latitude;
										formattedJson.meetingByMarket[mm].Longitude = jsonObj[x].Longitude;
									formattedJson.meetingByMarket[mm].Prefix = jsonObj[x].Prefix;
										*/
										formattedJson.meetingByMarket[mm].CountryId = jsonObj[x].Value5;
										formattedJson.meetingByMarket[mm].MeetingCount = parseInt(jsonObj[x].Value1);
										formattedJson.meetingByMarket[mm].CountryName = jsonObj[x].Value2;
										formattedJson.meetingByMarket[mm].Latitude = jsonObj[x].Value3;
										formattedJson.meetingByMarket[mm].Longitude = jsonObj[x].Value4;
										formattedJson.meetingByMarket[mm].Prefix = jsonObj[x].Prefix;

										mm++
									}


									if (jsonObj[x].OutputType == 'voteCastAgainstMgmt') {

										if (vcam == 0) {

											formattedJson.voteCastAgainstMgmt = new Array;
										}
										/*formattedJson.voteCastAgainstMgmt[vcam]=new Object
										formattedJson.voteCastAgainstMgmt[vcam].For=jsonObj[x].WithMgmt;
										formattedJson.voteCastAgainstMgmt[vcam].against=jsonObj[x].AgainstMgmt;
										formattedJson.voteCastAgainstMgmt[vcam].NotApplicable=jsonObj[x].NotApplicable;
										formattedJson.voteCastAgainstMgmt[vcam].id=4; //arbitrary number */

										formattedJson.voteCastAgainstMgmt[vcam] = new Object
										formattedJson.voteCastAgainstMgmt[vcam].For = parseInt(jsonObj[x].Value2);
										formattedJson.voteCastAgainstMgmt[vcam].against = parseInt(jsonObj[x].Value1);
										formattedJson.voteCastAgainstMgmt[vcam].NotApplicable = parseInt(jsonObj[x].Value3);
										formattedJson.voteCastAgainstMgmt[vcam].id = 4;

										vcam++
									}

									if (jsonObj[x].OutputType == 'industryPercentage') {

										if (ip == 0) {

											formattedJson.industryPercentage = new Array;
										}
										formattedJson.industryPercentage[ip] = new Object
										/*formattedJson.industryPercentage[ip].id=jsonObj[x].SectorType;
										formattedJson.industryPercentage[ip].value=jsonObj[x].TwoDigitSectorID;
										formattedJson.industryPercentage[ip].value=jsonObj[x].MeetingBySectorMeetingCount;*/
										formattedJson.industryPercentage[ip].sectorId = jsonObj[x].TwoDigitSectorID;
										formattedJson.industryPercentage[ip].id = jsonObj[x].Value1;
										//formattedJson.industryPercentage[ip].value=jsonObj[x].Value2;
										formattedJson.industryPercentage[ip].value = parseInt(jsonObj[x].Value3);
										ip++
									}

									if (jsonObj[x].OutputType == 'VotingStatistics') {

										if (vs == 0) {

											formattedJson.votingStatistics = new Object;
											formattedJson.votingStatistics.chartData = new Array;
											formattedJson.votingStatistics.chartData[vs] = new Object;
											formattedJson.votingStatistics.chartData[vs].ClientVote = '';
											formattedJson.votingStatistics.chartData[vs].CountOfVotesCast = '';
											formattedJson.votingStatistics.chartData[vs].tmp = { role: 'style' };
											formattedJson.votingStatistics.chartData[vs].Tooltip = { role: 'tooltip', 'p': { 'html': true } };
											formattedJson.votingStatistics.otherData = new Array;
											formattedJson.votingStatistics.otherData[0] = new Object;
											vs++;
										}
										if (jsonObj[x].Value1 != 'Votable Proposals' && jsonObj[x].Value1 != 'Voted Proposals' && jsonObj[x].Value1 != 'Voted Varying Ways') {
											formattedJson.votingStatistics.chartData[vs] = new Object;
											/* formattedJson.votingStatistics.chartData[vs].ClientVote=jsonObj[x].ClientVote;									
											formattedJson.votingStatistics.chartData[vs].CountOfVotesCast=jsonObj[x].CountOfVotesCast; */
											formattedJson.votingStatistics.chartData[vs].ClientVote = jsonObj[x].Value1;
											formattedJson.votingStatistics.chartData[vs].CountOfVotesCast = parseInt(jsonObj[x].Value2);
											formattedJson.votingStatistics.chartData[vs].tmp = "";
											vs++
										}
										else {
											if (jsonObj[x].Value1 == 'Votable Proposals') {
												formattedJson.votingStatistics.otherData[0].votabledata = parseInt(jsonObj[x].Value2);
											}
											if (jsonObj[x].Value1 == 'Voted Proposals') {
												formattedJson.votingStatistics.otherData[0].voteddata = parseInt(jsonObj[x].Value2);
											}
											if (jsonObj[x].Value1 == 'Voted Varying Ways') {
												formattedJson.votingStatistics.otherData[0].waysvoted = parseInt(jsonObj[x].Value2);
											}

										}

									}

									if (jsonObj[x].OutputType == 'votingCastProposalCategory') {

										if (vps_s == 0) {

											formattedJson.votingCastProposalCategory = new Object;
											formattedJson.votingCastProposalCategory.Shareholder = new Object;
											formattedJson.votingCastProposalCategory.Shareholder.chartData = new Array;
											formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s] = new Object;
											//formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].Color='';	
											formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].ClientVote = '';
											formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].ClientVoteTest = '';
											formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].Tooltip = { role: 'tooltip', 'p': { 'html': true } };
											formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].TotalVotes = '';
											formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].tmp = { role: 'style' };
											formattedJson.votingCastProposalCategory.otherData = new Array;
											formattedJson.votingCastProposalCategory.otherData[0] = new Object;
											vps_s++;
										}
										if (vps_m == 0) {

											//formattedJson.votingCastProposalCategory=new Object;									
											formattedJson.votingCastProposalCategory.Management = new Object;
											formattedJson.votingCastProposalCategory.Management.chartData = new Array;
											formattedJson.votingCastProposalCategory.Management.chartData[vps_m] = new Object;
											//formattedJson.votingCastProposalCategory.Management.chartData[vps_m].Color='';
											formattedJson.votingCastProposalCategory.Management.chartData[vps_m].ClientVote = '';
											formattedJson.votingCastProposalCategory.Management.chartData[vps_m].ClientVoteTest = '';
											formattedJson.votingCastProposalCategory.Management.chartData[vps_m].Tooltip = { role: 'tooltip', 'p': { 'html': true } };
											formattedJson.votingCastProposalCategory.Management.chartData[vps_m].TotalVotes = '';
											formattedJson.votingCastProposalCategory.Management.chartData[vps_m].tmp = { role: 'style' };
											//formattedJson.votingCastProposalCategory.otherData = new Array;
											//formattedJson.votingCastProposalCategory.otherData[0]=new Object;
											vps_m++;
										}
										if (jsonObj[x].Value3 != 'Total Management Votes' && jsonObj[x].Value3 != 'Total Shareholder Votes') {

											if (jsonObj[x].Value3 == 'Reorg. and Mergers') {
												jsonObj[x].Value3 = 'Reorganization and Mergers';
											}
											else if (jsonObj[x].Value3 == 'Non-Salary Comp.') {
												jsonObj[x].Value3 = 'Compensation';
											}
											else if (jsonObj[x].Value3 == 'SH-Routine/Business') {
												jsonObj[x].Value3 = 'Routine/Business';
											}
											else if (jsonObj[x].Value3 == "SH-Dirs' Related") {
												jsonObj[x].Value3 = 'Directors Related';
											}
											else if (jsonObj[x].Value3 == "SH-Corp Governance") {
												jsonObj[x].Value3 = 'Corporate Governance';
											}
											else if (jsonObj[x].Value3 == "SH-Soc./Human Rights") {
												jsonObj[x].Value3 = 'Social/Human Rights';
											}
											else if (jsonObj[x].Value3 == "SH-Compensation") {
												jsonObj[x].Value3 = 'Compensation';
											}
											else if (jsonObj[x].Value3 == "SH-Gen Econ Issues") {
												jsonObj[x].Value3 = 'General Economic Issues';
											}
											else if (jsonObj[x].Value3 == "SH-Health/Environ.") {
												jsonObj[x].Value3 = 'Health/Environmental';
											}
											else if (jsonObj[x].Value3 == "SH-Other/misc.") {
												jsonObj[x].Value3 = 'Other/Miscellaneous';
											}


											if (jsonObj[x].Value1 == 'Shareholder') {
												formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s] = new Object;
												//formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].Color='';	
												formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].ClientVote = jsonObj[x].Value3;
												formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].TotalVotes = parseInt(jsonObj[x].Value4);
												formattedJson.votingCastProposalCategory.Shareholder.chartData[vps_s].tmp = "";
												if (shareHolderMax == '') {
													shareHolderMax = jsonObj[x].Value3;
													shareHolderMaxValue = parseInt(jsonObj[x].Value4);
												}
												else {
													if (shareHolderMaxValue < jsonObj[x].Value4) {
														shareHolderMaxValue = parseInt(jsonObj[x].Value4);
														shareHolderMax = jsonObj[x].Value3;
													}
												}
												vps_s++;
											}
											if (jsonObj[x].Value1 == 'Management') {
												formattedJson.votingCastProposalCategory.Management.chartData[vps_m] = new Object;
												//formattedJson.votingCastProposalCategory.Management.chartData[vps_m].Color='';										
												formattedJson.votingCastProposalCategory.Management.chartData[vps_m].ClientVote = jsonObj[x].Value3;
												formattedJson.votingCastProposalCategory.Management.chartData[vps_m].TotalVotes = parseInt(jsonObj[x].Value4);
												formattedJson.votingCastProposalCategory.Management.chartData[vps_m].tmp = "";
												if (ManagementMax == '') {
													ManagementMax = jsonObj[x].Value3;
													ManagementMaxValue = parseInt(jsonObj[x].Value4);
												}
												else {
													if (ManagementMaxValue < jsonObj[x].Value4) {
														ManagementMaxValue = parseInt(jsonObj[x].Value4);
														ManagementMax = jsonObj[x].Value3;
													}
												}
												vps_m++;
											}
										}
										else {
											if (jsonObj[x].Value3 == 'Total Management Votes') {
												formattedJson.votingCastProposalCategory.otherData[0].ManagementVotes = parseInt(jsonObj[x].Value4);
											}
											if (jsonObj[x].Value3 == 'Total Shareholder Votes') {
												formattedJson.votingCastProposalCategory.otherData[0].ShareholderVotes = parseInt(jsonObj[x].Value4);
											}

											//formattedJson.votingCastProposalCategory[vps].value=jsonObj[x].TwoDigitSectorID;
											//formattedJson.votingCastProposalCategory[vps].CountOfVotesCast=jsonObj[x].CountOfVotesCast;
											//formattedJson.votingCastProposalCategory[vps].tmp = "";
										}

									}

								}

								formattedJson.votingCastProposalCategory.otherData[0].ManagementMax = ManagementMax;
								formattedJson.votingCastProposalCategory.otherData[0].shareHolderMax = shareHolderMax;
								//console.log('formattedData=>'+JSON.stringify(formattedJson)); 
								//$scope.votingStatistics = formattedJson.votingStatistics;
								//console.log('formattedData=>'+JSON.stringify(formattedJson.votingStatistics)); 
								//console.log('formattedData votingCastProposalCategory=>'+JSON.stringify(formattedJson.votingCastProposalCategory));

								//console.log('meetingByMarket=>'+JSON.stringify(formattedJson.meetingByMarket));

								response = formattedJson;
								//console.log('response votingStatistics=>'+JSON.stringify(response.votingStatistics));
								/*response['votingStatistics'] = [['', '', { role: 'style' }],
									  ['For', 270500],
									  ['Against/WithHold', 117000],k
									  ['Abstain', 80000],
									  ['Did Not Vote', 35000],
									  ['2 Years', 1000],
									  ['TEst', 100000],
									  ['TEst1', 200000],
									  ['TEst2', 400000] ];
									*/


								var abc = formattedJson.votingStatistics.chartData;
								var arrVS = new Array();
								for (x in abc) {
									arrVS[x] = new Array(abc[x].ClientVote, abc[x].CountOfVotesCast, abc[x].tmp, abc[x].Tooltip);
								}
								//console.log(arrVS);		
								response['votingStatistics']['chartData'] = arrVS;

								var abc_m = formattedJson.votingCastProposalCategory.Management.chartData;
								var arrVCPS_M = new Array();
								var m_cnt = 0;
								for (x in abc_m) {
									if (m_cnt == 0) {
										arrVCPS_M[x] = new Array(abc_m[x].ClientVote, abc_m[x].ClientVoteTest, abc_m[x].Tooltip, abc_m[x].TotalVotes, abc_m[x].tmp);
										m_cnt = -1;
									}
									else {
										arrVCPS_M[x] = new Array(abc_m[x].ClientVote, abc_m[x].TotalVotes, abc_m[x].tmp);
									}

								}
								//console.log(arrVS);		
								response['votingCastProposalCategory']['Management']['chartData'] = arrVCPS_M;


								var abc_s = formattedJson.votingCastProposalCategory.Shareholder.chartData;
								var arrVCPS_S = new Array();
								var s_cnt = 0;
								for (x in abc_s) {
									if (s_cnt == 0) {
										arrVCPS_S[x] = new Array(abc_s[x].ClientVote, abc_s[x].ClientVoteTest, abc_s[x].Tooltip, abc_s[x].TotalVotes, abc_s[x].tmp);
										s_cnt = -1;
									}
									else {
										arrVCPS_S[x] = new Array(abc_s[x].ClientVote, abc_s[x].TotalVotes, abc_s[x].tmp);
									}

								}
								//console.log(arrVS);		
								response['votingCastProposalCategory']['Shareholder']['chartData'] = arrVCPS_S;

								var responseCount = 0;
								for (mtu in response.meetingTypeUI) {
									//console.log(response.meetingTypeUI[mtu].id+'=>'+response.meetingTypeUI[mtu].value);
									if (response.meetingTypeUI[mtu].value > 0) {
										responseCount = 1;
										break;
									}

								}
							}
							else {
								var responseCount = 0;
							}
							//@TODO : check the response is null. remove meetingTypeUI hardcoding
							//console.log('custom===>'+JSON.stringify(response.meetingTypeUI));

							//console.log('voting stats chart=>'+response['votingStatistics']['chartData']);
							//console.log('Shareholder chart=>'+response['votingCastProposalCategory']['Shareholder']['chartData']);
							//console.log('Management chart=>'+response['votingCastProposalCategory']['Management']['chartData']);
							//if(response.meetingTypeUI){
							if (responseCount == 1) {		//if atleast on valid record is found
								$scope.error.noData = false;

								/*
								if(vdsServices.getCustomerId() == 3541)
								{
									var loadDashboardTile = vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+'/app/js/vds_components/CommonDashboardTile.js?version='+vdsServices.getCSSJSVersion()+'&random='+Math.random(); //
								}
								else
								{
									var loadDashboardTile = vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+ '/'+ vdsServices.getCustomerId() +'/directives/dashboardTile.js'; //
								}
								*/
								var loadDashboardTile = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/dashboardTile.js'; //

								LazyDirectiveLoader.load('ngDashboardTile', loadDashboardTile).then(function() {

									//$('#spinnerDiv').show();
									//console.log("loaded dashboarTile");
									//console.log('scope data:'+JSON.stringify($scope.data));
									//console.log('scope graph:'+$scope.customerPreference.GraphicalMetrics);
									var GraphicalMetricsArr = $scope.customerPreference.GraphicalMetrics.split('|');
									//console.log('GraphicalMetricsArr=>'+GraphicalMetricsArr);
									//angular.forEach( $scope.customerPreference.GraphicalMetrics, function(templateValue) {
									angular.forEach(GraphicalMetricsArr, function(templateValue) {
										angular.forEach($scope.data, function(directiveValue) {

											//console.log(directiveValue.componentID + "=="+  templateValue+ "=="+directiveValue.JSONIdentifier);

											if (directiveValue.componentID == templateValue) {
												//console.log("json=>"+directiveValue.JSONIdentifier); 
												//console.log('inside=>'+directiveValue.componentID);

												vdsServices["set" + directiveValue.JSONIdentifier](response[directiveValue.JSONIdentifier]);


												angular.element($('#tilesDiv')).append($compile('<' + directiveValue.directiveName + ' criteria="searchCriteria" block-title="' + directiveValue.componentName + '"  block-index="' + directiveValue.componentID + '"></' + directiveValue.directiveName + '>')($scope));
											}


										});
									});

									//if(directiveValue.componentID == 1)
									//{
									/*directiveValue.JSONIdentifier = 'votingCastProposalCategory';
									directiveValue.componentName = 'Votes Cast by Proposal Category';
									directiveValue.componentID = 10;
									directiveValue.directiveName = 'vds-vote-cast-proposal';
									console.log('inside again=>'+directiveValue.JSONIdentifier);
									 vdsServices["set"+'votingCastProposalCategory'](response['votingCastProposalCategory']);
											 
											 
											 angular.element($('#tilesDiv')).append($compile( '<'+'vds-vote-cast-proposal' +' criteria="searchCriteria" block-title="'+ 'Votes Cast by Proposal Category' +'"  block-index="'+ '10' +'"></'+'vds-vote-cast-proposal'+'>'  )($scope)); */
									//}



								});

								//console.log('graphs done');
								$scope.showDashboard = true;
								$scope.dashboardData = 1;
								//$('#spinnerDiv').hide();
							}
							else {
								//console.log('hide here 1');
								//$('#spinnerDiv').hide();
								//$scope.error.noData = true;		//this will be set via watch
								$scope.dashboardData = 0;
							}
						}

					}, function(error) {
						//$('#spinnerDiv').hide();
						$scope.error.noData = true;
						$scope.dashboardData = 0;
						//console.log("error");

					});
					//$('#spinnerDiv').hide();


				};

				$scope.getGraphsData = function() {


					$scope.meetingTableData = -1;
					$scope.dashboardData = -1;
					$scope.error.noData = false;
					$scope.showTable.onlyTable = false;

					//$('#spinnerDiv').show();
					//$scope.isLoading = true;	//
					$(".datepickerClass").attr('disabled', 'disabled');
					$("#toDatepicker").attr('disabled', 'disabled');
					$(".fundSelectClass").attr('disabled', 'disabled');
					$("#fundFamilySelect").attr('disabled', 'disabled');
					$(".companyOrTickerClass").attr('disabled', 'disabled');
					$("#generatePdf").attr('disabled', 'disabled');
					$('.countryMultiSelectClass').multiselect('disable');
					$('.fundMultiSelectClass').multiselect('disable');

					//@TODO : change the api call to get only the chart data

					//getGraphData_Market
					var formattedJson = new Object;
					$scope.graphResponse = new Object;
					$scope.graphsLoaded = new Array;
					$scope.GraphData_Type = -1;
					$scope.GraphData_Market = -1;
					$scope.GraphData_VotesCastAlignmentManagement = -1;
					$scope.GraphData_MeetingsBySector = -1;
					$scope.GraphData_VotingStatistics = -1;
					$scope.GraphData_VoteCastProposalCategory = -1;
					var responseCount = 0;


					var srchStr = 'customerID=' + $routeParams.id + '&fromDate=' + $scope.searchCriteria.fromDate + '&toDate=' + $scope.searchCriteria.toDate;
					var MeetingTypeList = '';

					if($scope.selectedSignificantOption != '' && $scope.selectedSignificantOption != undefined){

						srchStr += '&signMeeting=' + $scope.selectedSignificantOption.sid;

					}	

					if ($scope.searchCriteria.companyOrTicker != '' && $scope.searchCriteria.companyOrTicker != undefined)
					//if($scope.searchCriteria.companyOrTicker == '' || $scope.searchCriteria.companyOrTicker == undefined)
					{
						strCompanyOrTicker = encodeURIComponent($scope.searchCriteria.companyOrTicker);
						srchStr += "&company=" + strCompanyOrTicker;
						if (strCompanyOrTicker.indexOf('\'') >= 0){
							strCompanyOrTicker = strCompanyOrTicker.replace("\'", "\''");
						}
						srchStr += '&companyOrTicker=' + strCompanyOrTicker;//unescape(encodeURIComponent($scope.searchCriteria.companyOrTicker));
						//srchStr += '&companyOrTicker='+decodeURIComponent(escape(unescape(encodeURIComponent('HÃ©r'))));//unescape(encodeURIComponent($scope.searchCriteria.companyOrTicker));
					}

					//if($scope.searchCriteria.fundFamilyValue != '' && $scope.searchCriteria.fundFamilyValue != undefined)

					var ff_selectedLength = $(".fundFamilyMultiSelectClass :selected").length;
					var ff_optionLength = $(".fundFamilyMultiSelectClass option").length;

					var f_selectedLength = $(".fundMultiSelectClass :selected").length;
					var f_optionLength = $(".fundMultiSelectClass option").length;

					var fundListStr = '';
					var fundFamily_funds = '';
					//if($scope.searchCriteria.fundFamilyValue != '' && $scope.searchCriteria.fundFamilyValue != undefined)	
					if (ff_selectedLength != ff_optionLength && ff_selectedLength != 0) {

						var fundListStr = '';
						if (f_selectedLength != f_optionLength) {
							$('.fundMultiSelectClass option:selected').each(function() {
								//alert($(this).prop('selected')+'=>'+$(this).val());
								if (fundListStr == '') {
									fundListStr += $(this).val();
								}
								else {
									//fundListStr += '||'+$(this).val();
									fundListStr += '%7C%7C' + $(this).val();
								}
							});
						}

						/*if($scope.searchCriteria.fundValue != '' && $scope.searchCriteria.fundValue != undefined)
						{
							srchStr += '&fundValue='+$scope.searchCriteria.fundValue;							
						}
						*/
						if (fundListStr != '') {
							srchStr += '&fundValue=' + fundListStr;
						}
						else {
							var fundFamily_funds = '';

							angular.forEach($scope.fundList, function(val, key) {
								//if(val.FundFamilyID == $scope.searchCriteria.fundFamilyValue){
								if ($("option[value=" + val.FundFamilyID + "]", $('.fundFamilyMultiSelectClass')).prop('selected') == true) {
									if (fundFamily_funds != '') {
										//fundFamily_funds += '||'+val.fundID;
										fundFamily_funds += '%7C%7C' + val.fundID;
									}
									else {
										fundFamily_funds += val.fundID;
									}
								}
							});
							//console.log(fundFamily_funds);
							srchStr += '&fundValue=' + fundFamily_funds;
						}

					}
					else {
						/*
						if($scope.searchCriteria.fundValue != '' && $scope.searchCriteria.fundValue != undefined)
						{
							srchStr += '&fundValue='+$scope.searchCriteria.fundValue;
						}
						*/
						var fundListStr = '';
						if (f_selectedLength != f_optionLength) {
							$('.fundMultiSelectClass option:selected').each(function() {
								//alert($(this).prop('selected')+'=>'+$(this).val());
								if (fundListStr == '') {
									fundListStr += $(this).val();
								}
								else {
									//fundListStr += '||'+$(this).val();
									fundListStr += '%7C%7C' + $(this).val();
								}
							});
						}

						if (fundListStr != '') {
							//srchStr += '&SearchCountry='+fundListStr;
							srchStr += '&fundValue=' + fundListStr;
						}
					}

					if (fundListStr == '' && fundFamily_funds == '' && $scope.ValidURLFundFamily != false) {
						var fundListString = '';
						angular.forEach($scope.fundList, function(value) {

							if (value.FundFamilyID == $scope.ValidURLFundFamily) {

								if (fundListString == '') {
									fundListString += value.fundID;
								}
								else {
									//fundListString += '||'+value.fundID;
									fundListString += '%7C%7C' + value.fundID;
								}
							}
						});
						srchStr += '&fundValue=' + fundListString;
					}
               

					var countryListStr = '';
					//if($("input[value='multiselect-all']").is(":checked") == false)
					//console.log($(".countryMultiSelectClass :selected").length+'=>'+$(".countryMultiSelectClass option").length);
					if ($(".countryMultiSelectClass :selected").length != $(".countryMultiSelectClass option").length) {
						$('.countryMultiSelectClass option:selected').each(function() {
							//alert($(this).prop('selected')+'=>'+$(this).val());
							if (countryListStr == '') {
								countryListStr += vdsAppHelper.getLangPropertyKey($(this).val());
							}
							else {
								//countryListStr += '||'+$(this).val();
								countryListStr += '%7C%7C' + vdsAppHelper.getLangPropertyKey($(this).val());
							}
						});
					}
					//console.log(countryListStr);
					if (countryListStr != '') {
						srchStr += '&SearchCountry=' + countryListStr;
					}

					srchStr += '&liveSiteYN=' + vdsServices.isLiveSite()+"&actionCode="+loggerHelperConfig.actionCode+"&sessionToken="+loggerHelperConfig.sessionToken;

					/*
					if($scope.searchCriteria.countryListValue != '' && $scope.searchCriteria.countryListValue != undefined)
					{					
						
						var tmpParams = $scope.searchCriteria.countryListValue;
						 var countryListStr = '';
						 for(var j=0;j<tmpParams.length;j++)
						 {	
							subParams = tmpParams[j].split(':');						
							if(countryListStr == '')
							{
								countryListStr += subParams[1];
							}
							else
							{
								countryListStr += '||'+subParams[1];
							}
							
							
						 }  
						 srchStr += '&SearchCountry='+countryListStr;					
					}
					*/

					/*
					var promise8 = $http({ method: 'GET', url: vdsServices.getBaseURL() + 'vdsapi/getVdsData/8?' + srchStr, cache: 'true' });
					var promise9 = $http({ method: 'GET', url: vdsServices.getBaseURL() + 'vdsapi/getVdsData/9?' + srchStr, cache: 'true' });
					var promise10 = $http({ method: 'GET', url: vdsServices.getBaseURL() + 'vdsapi/getVdsData/10?' + srchStr, cache: 'true' });
					var promise11 = $http({ method: 'GET', url: vdsServices.getBaseURL() + 'vdsapi/getVdsData/11?' + srchStr, cache: 'true' });
					var promise12 = $http({ method: 'GET', url: vdsServices.getBaseURL() + 'vdsapi/getVdsData/12?' + srchStr, cache: 'true' });
					var promise13 = $http({ method: 'GET', url: vdsServices.getBaseURL() + 'vdsapi/getVotesCastByProposalCategory?' + srchStr + "&voteCastProposalGraph=1", cache: 'true' });
					var promise14 = $http({ method: 'GET', url: vdsServices.getBaseURL() + 'vdsapi/getVotesCastByProposalCategory?' + srchStr + "&voteCastProposalGraph=0", cache: 'true' });
					*/

					// $q.all([promise8, promise9, promise10, promise11, promise12, promise13, promise14])
					$q.all(vdsAppHelper.fetchGraphResponse($http, srchStr))					
					.then(function(data) {
						//console.log('data[0]=>'+data[0]);
						//console.log('data[1]=>'+data[1]);
						var response = new Object;
						response = data[0].data;

						if (response.data != '' && response.data != null) {
							var response1 = response.data;
							//console.log(response1.toSource());							
							var jsonObj = response1;
							var formattedJson = new Object;

							//console.log(json)
							var mc = 0;
							var mm = 0;
							var ip = 0;
							var vs = 0, vsd = 0, vps_s = 0, vps_m = 0;
							var shareHolderMax = '';
							var shareHolderMaxValue = 0;
							var ManagementMax = '';
							var ManagementMaxValue = 0;
							var vcam = 0;
							var x;
							//var votingStatisticsData = {};
							for (x in jsonObj) {

								if (jsonObj[x].OutputType == 'meetingTypeUI') {

									if (mc == 0) {

										formattedJson.meetingTypeUI = new Array;
									}
									formattedJson.meetingTypeUI[mc] = new Object
									formattedJson.meetingTypeUI[mc].id = jsonObj[x].MeetingType;
									formattedJson.meetingTypeUI[mc].value = jsonObj[x].MeetingTypeCount;
									//formattedJson.meetingTypeUI[mc].id=jsonObj[x].Value1;
									//formattedJson.meetingTypeUI[mc].value=parseInt(jsonObj[x].Value2);

									mc++
								}
							}


							if(data[1]!==null){
							var response2 = data[1].data.data;
							var jsonObj = response2;
							for (x in jsonObj) {

								if (jsonObj[x].OutputType == 'meetingByMarket') {

									if (mm == 0) {

										formattedJson.meetingByMarket = new Array;
									}
									formattedJson.meetingByMarket[mm] = new Object
									formattedJson.meetingByMarket[mm].CountryId = jsonObj[x].CountryID;
									formattedJson.meetingByMarket[mm].MeetingCount = jsonObj[x].MeetingCountryCount;
									formattedJson.meetingByMarket[mm].CountryName = jsonObj[x].MeetingCountry;
									formattedJson.meetingByMarket[mm].Latitude = jsonObj[x].Latitude;
									formattedJson.meetingByMarket[mm].Longitude = jsonObj[x].Longitude;
									formattedJson.meetingByMarket[mm].Prefix = jsonObj[x].Prefix;

									//formattedJson.meetingByMarket[mm].CountryId=jsonObj[x].Value5;
									//formattedJson.meetingByMarket[mm].MeetingCount=parseInt(jsonObj[x].Value1);
									//formattedJson.meetingByMarket[mm].CountryName=jsonObj[x].Value2;
									//formattedJson.meetingByMarket[mm].Latitude=jsonObj[x].Value3;
									//formattedJson.meetingByMarket[mm].Longitude=jsonObj[x].Value4;


									mm++
								}

							}
							}

							if(data[2]!==null){
							var response3 = data[2].data.data;
							var jsonObj = response3;
							for (x in jsonObj) {
								if (jsonObj[x].OutputType == 'voteCastAgainstMgmt') {

									if (vcam == 0) {

										formattedJson.voteCastAgainstMgmt = new Array;
									}
									formattedJson.voteCastAgainstMgmt[vcam] = new Object
									formattedJson.voteCastAgainstMgmt[vcam].For = jsonObj[x].WithMgmt;
									formattedJson.voteCastAgainstMgmt[vcam].against = jsonObj[x].AgainstMgmt;
									formattedJson.voteCastAgainstMgmt[vcam].NotApplicable = jsonObj[x].NotApplicable;
									formattedJson.voteCastAgainstMgmt[vcam].id = 4; //arbitrary number 

									//formattedJson.voteCastAgainstMgmt[vcam]=new Object
									//formattedJson.voteCastAgainstMgmt[vcam].For=parseInt(jsonObj[x].Value2);
									//formattedJson.voteCastAgainstMgmt[vcam].against=parseInt(jsonObj[x].Value1);
									//formattedJson.voteCastAgainstMgmt[vcam].NotApplicable=parseInt(jsonObj[x].Value3);
									//formattedJson.voteCastAgainstMgmt[vcam].id=4;

									vcam++
								}
							}
							}

							if(data[3]!==null){
							var response4 = data[3].data.data;
							var jsonObj = response4;
							for (x in jsonObj) {
								if (jsonObj[x].OutputType == 'industryPercentage') {

									if (ip == 0) {

										formattedJson.industryPercentage = new Array;
									}
									formattedJson.industryPercentage[ip] = new Object
									formattedJson.industryPercentage[ip].id = jsonObj[x].SectorType;
									formattedJson.industryPercentage[ip].sectorId = jsonObj[x].TwoDigitSectorID;
									formattedJson.industryPercentage[ip].value = jsonObj[x].MeetingBySectorMeetingCount;

									//formattedJson.industryPercentage[ip].id=jsonObj[x].Value1;
									//formattedJson.industryPercentage[ip].value=jsonObj[x].Value2;	//
									//formattedJson.industryPercentage[ip].value=parseInt(jsonObj[x].Value3);
									ip++
								}
							}
							}

							if(data[4]!==null){
							var response5 = data[4].data.data;
							var jsonObj = response5;
							for (x in jsonObj) {
								if (jsonObj[x].OutputType == 'VotingStatistics') {

									if (vs == 0) {

										formattedJson.votingStatistics = new Object;
										formattedJson.votingStatistics.chartData = new Array;
										formattedJson.votingStatistics.chartData[vs] = new Object;
										formattedJson.votingStatistics.chartData[vs].ClientVote = '';
										formattedJson.votingStatistics.chartData[vs].CountOfVotesCast = '';
										formattedJson.votingStatistics.chartData[vs].tmp = { role: 'style' };
										formattedJson.votingStatistics.chartData[vs].Tooltip = { role: 'tooltip', 'p': { 'html': true } };
										formattedJson.votingStatistics.otherData = new Array;
										formattedJson.votingStatistics.otherData[0] = new Object;
										vs++;
									}
									if (jsonObj[x].ClientVote != 'Votable Proposals' && jsonObj[x].ClientVote != 'Voted Proposals' && jsonObj[x].ClientVote != 'Voted Varying Ways') {
										formattedJson.votingStatistics.chartData[vs] = new Object;
										formattedJson.votingStatistics.chartData[vs].ClientVote = jsonObj[x].ClientVote;
										formattedJson.votingStatistics.chartData[vs].CountOfVotesCast = jsonObj[x].CountOfVotesCast;
										//formattedJson.votingStatistics.chartData[vs].ClientVote=jsonObj[x].Value1;									
										//formattedJson.votingStatistics.chartData[vs].CountOfVotesCast=parseInt(jsonObj[x].Value2);
										formattedJson.votingStatistics.chartData[vs].tmp = "";
										vs++
									}
									else {
										if (jsonObj[x].ClientVote == 'Votable Proposals') {
											formattedJson.votingStatistics.otherData[0].votabledata = parseInt(jsonObj[x].CountOfVotesCast);
										}
										if (jsonObj[x].ClientVote == 'Voted Proposals') {
											formattedJson.votingStatistics.otherData[0].voteddata = parseInt(jsonObj[x].CountOfVotesCast);
										}
										if (jsonObj[x].ClientVote == 'Voted Varying Ways') {
											formattedJson.votingStatistics.otherData[0].waysvoted = parseInt(jsonObj[x].CountOfVotesCast);
										}

									}

								}
							}
							}
							//var jsonObj = new Array;
							//console.log(jsonObj);
							/* jsonObj = eval("[" + '{"TotalVotes":1024,"ProposalCode":"M05","ProposalCategory":"Management","ProposalText":"Non-Salary Comp.","OutputType":"votingCastProposalCategory"},{"TotalVotes":29,"ProposalCode":"S01","ProposalCategory":"Shareholder","ProposalText":"SH-Routine/Business","OutputType":"votingCastProposalCategory"},{"TotalVotes":107,"ProposalCode":"S02","ProposalCategory":"Shareholder","ProposalText":"SH-Dirs\' Related","OutputType":"votingCastProposalCategory"},{"TotalVotes":47,"ProposalCode":"S08","ProposalCategory":"Shareholder","ProposalText":"SH-Other/misc.","OutputType":"votingCastProposalCategory"},{"TotalVotes":156,"ProposalCode":"M04","ProposalCategory":"Management","ProposalText":"Reorg. and Mergers","OutputType":"votingCastProposalCategory"},{"TotalVotes":29,"ProposalCode":"S03","ProposalCategory":"Shareholder","ProposalText":"SH-Corp Governance","OutputType":"votingCastProposalCategory"},{"TotalVotes":6,"ProposalCode":"S04","ProposalCategory":"Shareholder","ProposalText":"SH-Soc./Human Rights","OutputType":"votingCastProposalCategory"},{"TotalVotes":23,"ProposalCode":"S05","ProposalCategory":"Shareholder","ProposalText":"SH-Compensation","OutputType":"votingCastProposalCategory"},{"TotalVotes":156,"ProposalCode":"M06","ProposalCategory":"Management","ProposalText":"Antitakeover Related","OutputType":"votingCastProposalCategory"},{"TotalVotes":41,"ProposalCode":"S07","ProposalCategory":"Shareholder","ProposalText":"SH-Health/Environ.","OutputType":"votingCastProposalCategory"},{"TotalVotes":5,"ProposalCode":"S09","ProposalCategory":"Shareholder","ProposalText":"Social Proposal","OutputType":"votingCastProposalCategory"},{"TotalVotes":2474,"ProposalCode":"M01","ProposalCategory":"Management","ProposalText":"Routine/Business","OutputType":"votingCastProposalCategory"},{"TotalVotes":5930,"ProposalCode":"M02","ProposalCategory":"Management","ProposalText":"Directors Related","OutputType":"votingCastProposalCategory"},{"TotalVotes":1020,"ProposalCode":"M03","ProposalCategory":"Management","ProposalText":"Capitalization","OutputType":"votingCastProposalCategory"},{"TotalVotes":2,"ProposalCode":"S06","ProposalCategory":"Shareholder","ProposalText":"SH-Gen Econ Issues","OutputType":"votingCastProposalCategory"},{"TotalVotes":10760,"ProposalCode":null,"ProposalCategory":null,"ProposalText":"Total Management Votes","OutputType":"votingCastProposalCategory"},{"TotalVotes":289,"ProposalCode":null,"ProposalCategory":null,"ProposalText":"Total Shareholder Votes","OutputType":"votingCastProposalCategory"}' + "]");
							*/
							//	 {"data":[{"TotalVotes":1024,"ProposalCode":"M05","ProposalCategory":"Management","ProposalText":"Non-Salary Comp.","OutputType":"votingCastProposalCategory"},{"TotalVotes":29,"ProposalCode":"S01","ProposalCategory":"Shareholder","ProposalText":"SH-Routine/Business","OutputType":"votingCastProposalCategory"},{"TotalVotes":107,"ProposalCode":"S02","ProposalCategory":"Shareholder","ProposalText":"SH-Dirs' Related","OutputType":"votingCastProposalCategory"},{"TotalVotes":47,"ProposalCode":"S08","ProposalCategory":"Shareholder","ProposalText":"SH-Other/misc.","OutputType":"votingCastProposalCategory"},{"TotalVotes":156,"ProposalCode":"M04","ProposalCategory":"Management","ProposalText":"Reorg. and Mergers","OutputType":"votingCastProposalCategory"},{"TotalVotes":29,"ProposalCode":"S03","ProposalCategory":"Shareholder","ProposalText":"SH-Corp Governance","OutputType":"votingCastProposalCategory"},{"TotalVotes":6,"ProposalCode":"S04","ProposalCategory":"Shareholder","ProposalText":"SH-Soc./Human Rights","OutputType":"votingCastProposalCategory"},{"TotalVotes":23,"ProposalCode":"S05","ProposalCategory":"Shareholder","ProposalText":"SH-Compensation","OutputType":"votingCastProposalCategory"},{"TotalVotes":156,"ProposalCode":"M06","ProposalCategory":"Management","ProposalText":"Antitakeover Related","OutputType":"votingCastProposalCategory"},{"TotalVotes":41,"ProposalCode":"S07","ProposalCategory":"Shareholder","ProposalText":"SH-Health/Environ.","OutputType":"votingCastProposalCategory"},{"TotalVotes":5,"ProposalCode":"S09","ProposalCategory":"Shareholder","ProposalText":"Social Proposal","OutputType":"votingCastProposalCategory"},{"TotalVotes":2474,"ProposalCode":"M01","ProposalCategory":"Management","ProposalText":"Routine/Business","OutputType":"votingCastProposalCategory"},{"TotalVotes":5930,"ProposalCode":"M02","ProposalCategory":"Management","ProposalText":"Directors Related","OutputType":"votingCastProposalCategory"},{"TotalVotes":1020,"ProposalCode":"M03","ProposalCategory":"Management","ProposalText":"Capitalization","OutputType":"votingCastProposalCategory"},{"TotalVotes":2,"ProposalCode":"S06","ProposalCategory":"Shareholder","ProposalText":"SH-Gen Econ Issues","OutputType":"votingCastProposalCategory"},{"TotalVotes":10760,"ProposalCode":null,"ProposalCategory":null,"ProposalText":"Total Management Votes","OutputType":"votingCastProposalCategory"},{"TotalVotes":289,"ProposalCode":null,"ProposalCategory":null,"ProposalText":"Total Shareholder Votes","OutputType":"votingCastProposalCategory"}]}

							// VDS-990 - [START]
							graphResponseParser.vdsServices = vdsServices;
							if(data[5]!==null){
							graphResponseParser.votesCastByProposalCategoryGraph.processResponse(data[5].data.data);
							}
							if(data[6]!==null){
							graphResponseParser.votingCastAlignMgmtProposalCategory.processResponse(data[6].data.data);
							}
							graphResponseParser.clearReferences();
							
							// VDS-990 - [END]
							
							//console.log('formattedData=>'+JSON.stringify(formattedJson)); 
							//$scope.votingStatistics = formattedJson.votingStatistics;
							//console.log('formattedData=>'+JSON.stringify(formattedJson.votingStatistics)); 
							//console.log('formattedData votingCastProposalCategory=>'+JSON.stringify(formattedJson.votingCastProposalCategory));

							//console.log('meetingByMarket=>'+JSON.stringify(formattedJson.meetingByMarket));
							//formattedJson.meetingTypeUI = eval("[" + '{"id":"Annual","value":1579},{"id":"Annual/Special","value":273},{"id":"Bondholder","value":11},{"id":"Court","value":19},{"id":"Proxy Contest","value":1},{"id":"Special","value":527},{"id":"Warrant Holder","value":1},{"id":"Written Consent","value":2},{"id":"Voted","value":1747},{"id":"Unvoted","value":666}' + "]");
							//console.log('meetingTypeUI=>'+JSON.stringify(formattedJson.meetingTypeUI));
							//[{"id":"Annual","value":1494},{"id":"Annual/Special","value":99},{"id":"Court","value":18},{"id":"Debenture Holder","value":1},{"id":"Proxy Contest","value":2},{"id":"Special","value":667},{"id":"Voted","value":1716},{"id":"Unvoted","value":565}]
							//formattedJson.meetingTypeUI = eval("[" + '{"id":"Annual","value":1579},{"id":"Annual/Special","value":273},{"id":"Bondholder","value":11},{"id":"Court","value":19},{"id":"Proxy Contest","value":1},{"id":"Special","value":527},{"id":"Warrant Holder","value":1},{"id":"Written Consent","value":2},{"id":"Voted","value":1747},{"id":"Unvoted","value":666}' + "]");

							response = formattedJson;
							//console.log('response votingStatistics=>'+JSON.stringify(response.votingStatistics));
							//response['votingStatistics'] = [['', '', { role: 'style' }],
							//  ['For', 270500],
							//  ['Against/WithHold', 117000],k
							//  ['Abstain', 80000],
							//  ['Did Not Vote', 35000],
							//  ['2 Years', 1000],
							// ['TEst', 100000],
							//  ['TEst1', 200000],
							// ['TEst2', 400000] ];


							if(data[4]!==null){
							var abc = formattedJson.votingStatistics.chartData;
							var arrVS = new Array();
							for (x in abc) {
								arrVS[x] = new Array(abc[x].ClientVote, abc[x].CountOfVotesCast, abc[x].tmp, abc[x].Tooltip);
							}
							//console.log(arrVS);		
							response['votingStatistics']['chartData'] = arrVS;
							}						
							
							var responseCount = 0;
							for (mtu in response.meetingTypeUI) {
								//console.log(response.meetingTypeUI[mtu].id+'=>'+response.meetingTypeUI[mtu].value);
								if (response.meetingTypeUI[mtu].value > 0) {
									responseCount = 1;
									break;
								}

							}
						}
						else {
							var responseCount = 0;
						}
						//@TODO : check the response is null. remove meetingTypeUI hardcoding
						//console.log('custom===>'+JSON.stringify(response.meetingTypeUI));

						//console.log('voting stats chart=>'+response['votingStatistics']['chartData']);
						//console.log('Shareholder chart=>'+response['votingCastProposalCategory']['Shareholder']['chartData']);
						//console.log('Management chart=>'+response['votingCastProposalCategory']['Management']['chartData']);
						//if(response.meetingTypeUI){
						if (responseCount == 1) {		//if atleast on valid record is found
							$scope.error.noData = false;


							if ($scope.customDashboardProperties.tileFile == 'global') //(vdsServices.getCustomerId() == 3541)
							{
								var loadDashboardTile = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/app/js/vds_components/CommonDashboardTile.js?version=' + vdsServices.getCSSJSVersion() + '&random=' + Math.random(); //
							}
							else {
								var loadDashboardTile = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/dashboardTile.js?version=' + vdsServices.getCSSJSVersion() + '&random=' + Math.random(); //
							}

							//var loadDashboardTile = vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+'/'+ vdsServices.getCustomerId() +'/directives/dashboardTile.js?version='+vdsServices.getCSSJSVersion()+'&random='+Math.random(); //

							LazyDirectiveLoader.load('ngDashboardTile', loadDashboardTile).then(function() {
								//LazyDirectiveLoader.load('ngDashboardTile', vdsServices.getBaseURL() + 'repo/'+ vdsServices.getCustomerId() +'/directives/dashboardTile.js').then(function() {

								//$('#spinnerDiv').show();
								//console.log("loaded dashboarTile");
								//console.log('scope data:'+JSON.stringify($scope.data));
								//console.log('scope graph:'+$scope.customerPreference.GraphicalMetrics);
								//$scope.customerPreference.GraphicalMetrics = '4|5|6|7|9|10';


								if (vdsServices.isLiveSite() == 1)	//live site
								{
									var GraphicalMetricsArr = $scope.customerPreference.GraphicalMetrics.split('|');
								}
								else								//staging site
								{
									var GraphicalMetricsArr = $scope.customerPreference.GraphicalMetrics.split('|');
								}
								//console.log('GraphicalMetricsArr=>'+GraphicalMetricsArr);
								//angular.forEach( $scope.customerPreference.GraphicalMetrics, function(templateValue) {
								angular.forEach(GraphicalMetricsArr, function(templateValue) {
									angular.forEach($scope.data, function(directiveValue) {

										//console.log(directiveValue.componentID + "=="+  templateValue+ "=="+directiveValue.JSONIdentifier);

										if (directiveValue.componentID == templateValue) {
											//console.log("json=>"+directiveValue.JSONIdentifier); 
											//console.log('inside=>'+directiveValue.componentID);

											if(["votingCastProposalCategory","votingCastAlignMgmtProposalCategory"].indexOf(directiveValue.JSONIdentifier) === -1){
												vdsServices["set" + directiveValue.JSONIdentifier](response[directiveValue.JSONIdentifier]);											
											}


											angular.element($('#tilesDiv')).append($compile('<' + directiveValue.directiveName + ' criteria="searchCriteria" block-title="' + directiveValue.componentName + '"  block-index="' + directiveValue.componentID + '"></' + directiveValue.directiveName + '>')($scope));

										}


									});
								});								
								vdsAppHelper.addPageBreaksForPrint();
								//if(directiveValue.componentID == 1)
								//{
								/*directiveValue.JSONIdentifier = 'votingCastProposalCategory';
								directiveValue.componentName = 'Votes Cast by Proposal Category';
								directiveValue.componentID = 10;
								directiveValue.directiveName = 'vds-vote-cast-proposal';
								console.log('inside again=>'+directiveValue.JSONIdentifier);
								 vdsServices["set"+'votingCastProposalCategory'](response['votingCastProposalCategory']);
										 
										 
										 angular.element($('#tilesDiv')).append($compile( '<'+'vds-vote-cast-proposal' +' criteria="searchCriteria" block-title="'+ 'Votes Cast by Proposal Category' +'"  block-index="'+ '10' +'"></'+'vds-vote-cast-proposal'+'>'  )($scope)); */
								//}



							});

							//console.log('graphs done');
							$scope.showDashboard = true;
							$scope.dashboardData = 1;
							//$('#spinnerDiv').hide();
						}
						else {
							//console.log('hide here 1');
							//$('#spinnerDiv').hide();
							//$scope.error.noData = true;		//this will be set via watch
							$scope.dashboardData = 0;
						}


					});




				};

				$scope.checkQueryStringSpecialChars = function(myStr) {
					var hasSpecialChar = 0;
					if (myStr.indexOf('!') !== -1 || myStr.indexOf('#') !== -1 || myStr.indexOf('<') !== -1 || myStr.indexOf('>') !== -1 || myStr.indexOf('?') !== -1 || myStr.indexOf('%') !== -1 || myStr.indexOf('}') !== -1 || myStr.indexOf('{') !== -1) {
						hasSpecialChar = 1;
					}

					return hasSpecialChar;
				}

				var currentGridRequest;
				var EncodedCustomerID = $routeParams.id;

				//GET MEETINGLIST OG FUNCTION  
				$scope.getMeetingList = function(map) {
					if ($scope.siteFormat != 'dashboard') {
						$scope.meetingTableData = -1;
						$scope.dashboardData = -1;
						$('#spinnerDiv').show();
						$("#fromDatepicker").attr('disabled', 'disabled');
						$("#toDatepicker").attr('disabled', 'disabled');
						$("#fundSelect").attr('disabled', 'disabled');
						$("#fundFamilySelect").attr('disabled', 'disabled');
						$("#companyTicker").attr('disabled', 'disabled');
						$("#generatePdf").attr('disabled', 'disabled');

					}

					var srchStr = '';
					var MeetingTypeList = '';
					$scope.filterSummary.companyOrTicker.searchParam = '';
					$scope.filterSummary.companyOrTicker.show = false;
					var CustomerID = vdsServices.getCustomerId();

					if ($scope.searchCriteria.companyOrTicker != '' && $scope.searchCriteria.companyOrTicker != undefined) {
						strCompanyOrTicker = encodeURIComponent($scope.searchCriteria.companyOrTicker);
						if (strCompanyOrTicker.indexOf('\'') >= 0){
							strCompanyOrTicker = strCompanyOrTicker.replace("\'", "\''");
						}
						srchStr += '&companyOrTicker=' + strCompanyOrTicker;//unescape(encodeURIComponent($scope.searchCriteria.companyOrTicker));
						$scope.filterSummary.companyOrTicker.searchParam = decodeURI(strCompanyOrTicker);
						$scope.filterSummary.companyOrTicker.show = true;
						//srchStr += '&companyOrTicker='+decodeURIComponent(escape(unescape(encodeURIComponent('HÃ©r'))));//unescape(encodeURIComponent($scope.searchCriteria.companyOrTicker));
					}

					//if($scope.searchCriteria.fundFamilyValue != '' && $scope.searchCriteria.fundFamilyValue != undefined)

					var ff_selectedLength = $(".fundFamilyMultiSelectClass :selected").length;
					var ff_optionLength = $(".fundFamilyMultiSelectClass option").length;

					var f_selectedLength = $(".fundMultiSelectClass :selected").length;
					var f_optionLength = $(".fundMultiSelectClass option").length;

					var fundListStr = '';
					var fundFamily_funds = '';
					//if($scope.searchCriteria.fundFamilyValue != '' && $scope.searchCriteria.fundFamilyValue != undefined)


					$scope.filterSummary.significantMeeting = '';
					if($scope.selectedSignificantOption != '' && $scope.selectedSignificantOption != undefined){

						srchStr += '&signMeeting=' + $scope.selectedSignificantOption.sid;
						$scope.filterSummary.significantMeeting = $scope.selectedSignificantOption.name;

					}	
					$scope.filterSummary.fundFamilyList = '';
					$scope.filterSummary.fundList = '';
					if (ff_selectedLength != ff_optionLength && ff_selectedLength != 0) {
						var fundListStr = '';
						if (f_selectedLength != f_optionLength) {
							$('.fundMultiSelectClass option:selected').each(function() {
								//alert($(this).prop('selected')+'=>'+$(this).val());
								if (fundListStr == '') {
									fundListStr += $(this).val();
									$scope.filterSummary.fundList += $(this).attr("title");
								}
								else {
									//fundListStr += '||'+$(this).val();
									fundListStr += '%7C%7C' + $(this).val();
									$scope.filterSummary.fundList += ',' + $(this).attr("title");
								}
							});
							$scope.filterSummary.fundFamilyList = $('.fundFamilyMultiSelectButton').attr('title');
						}

						/*if($scope.searchCriteria.fundValue != '' && $scope.searchCriteria.fundValue != undefined)
						{
							srchStr += '&fundValue='+$scope.searchCriteria.fundValue;							
						}
						*/
						if (fundListStr != '') {
							srchStr += '&fundValue=' + fundListStr;
						}
						else {
							$scope.filterSummary.fundList = vdsServices.getPreferLanguageProperties().AllFundsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.fundFilter.selectAllText):vdsServices.getPreferLanguageProperties().AllFundsText;
							var fundFamily_funds = '';

							angular.forEach($scope.fundList, function(val, key) {
								//if(val.FundFamilyID == $scope.searchCriteria.fundFamilyValue){
								if ($("option[value=" + val.FundFamilyID + "]", $('.fundFamilyMultiSelectClass')).prop('selected') == true) {
									if (fundFamily_funds != '') {
										//fundFamily_funds += '||'+val.fundID;
										fundFamily_funds += '%7C%7C' + val.fundID;
										$scope.filterSummary.fundFamilyList += ',' + val.FundFamilyName;
									}
									else {
										fundFamily_funds += val.fundID;
										$scope.filterSummary.fundFamilyList += val.FundFamilyName;
									}
								}
							});
							//console.log(fundFamily_funds);
							srchStr += '&fundValue=' + fundFamily_funds;
						}

					}
					else {
						$scope.filterSummary.fundFamilyList = vdsServices.getPreferLanguageProperties().AllFundFamiliesText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFamilyFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.fundFamilyFilter.selectAllText):vdsServices.getPreferLanguageProperties().AllFundFamiliesText;
						/*
						if($scope.searchCriteria.fundValue != '' && $scope.searchCriteria.fundValue != undefined)
						{
							srchStr += '&fundValue='+$scope.searchCriteria.fundValue;
						}
						*/
						var fundListStr = '';
						if (f_selectedLength != f_optionLength) {
							$('.fundMultiSelectClass option:selected').each(function() {
								//alert($(this).prop('selected')+'=>'+$(this).val());
								if (fundListStr == '') {
									fundListStr += $(this).val();
									$scope.filterSummary.fundList += $(this).attr("title");
								}
								else {
									//fundListStr += '||'+$(this).val();
									fundListStr += '%7C%7C' + $(this).val();
									$scope.filterSummary.fundList += ',' + $(this).attr("title");
								}
							});
						}

						if (fundListStr != '') {
							//srchStr += '&SearchCountry='+fundListStr;
							srchStr += '&fundValue=' + fundListStr;
						}
						else {
							$scope.filterSummary.fundList = vdsServices.getPreferLanguageProperties().AllFundsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.fundFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.fundFilter.selectAllText): vdsServices.getPreferLanguageProperties().AllFundsText;
						}
					}  
					var tempFundFamily = $scope.filterSummary.fundFamilyList;
					var tempFundFamilyArr = tempFundFamily.split(',').map(function (item) {return item.trim()});
					let uniqueFundFamily  = [];
					tempFundFamilyArr.forEach(function(itm){
						rtn =  findUnique(itm, uniqueFundFamily);
						if(rtn==0)
						uniqueFundFamily.push(itm);
						});
					$scope.filterSummary.fundFamilyList = uniqueFundFamily.toString();
					if (fundListStr == '' && fundFamily_funds == '' && $scope.ValidURLFundFamily != false) {
						var fundListString = '';
						angular.forEach($scope.fundList, function(value) {

							if (value.FundFamilyID == $scope.ValidURLFundFamily) {

								if (fundListString == '') {
									fundListString += value.fundID;
								}
								else {
									//fundListString += '||'+value.fundID;
									fundListString += '%7C%7C' + value.fundID;
								}
							}


						});
						srchStr += '&fundValue=' + fundListString;
					}


					var countryListStr = '';

					$scope.filterSummary.countryList = '';
					//console.log($("input[value='multiselect-all']").is(":checked"));
					//if($("input[value='multiselect-all']").is(":checked") == false)
					//console.log($(".countryMultiSelectClass :selected").length+'=>'+$(".countryMultiSelectClass option").length);
					if ($(".countryMultiSelectClass :selected").length != $(".countryMultiSelectClass option").length) {
						$('.countryMultiSelectClass option:selected').each(function() {
							//alert($(this).prop('selected')+'=>'+$(this).val());
							if (countryListStr == '') {
								countryListStr += vdsAppHelper.getLangPropertyKey($(this).val());
								$scope.filterSummary.countryList += $(this).val();
							}
							else {
								//countryListStr += '||'+$(this).val();
								countryListStr += '%7C%7C' + vdsAppHelper.getLangPropertyKey($(this).val());
								$scope.filterSummary.countryList += ',' + $(this).val(); //For filter Summary
							}
						});
					}
					else {
						$scope.filterSummary.countryList =  vdsServices.getPreferLanguageProperties().AllMarketsText ==undefined ? $scope.getCustomOrCommonData($scope.customDashboardProperties.searchFilter.marketFilter.selectAllText, $scope.commonDashboardProperties.searchFilter.marketFilter.selectAllText):vdsServices.getPreferLanguageProperties().AllMarketsText;
					}


					if (countryListStr != '') {
						srchStr += '&SearchCountry=' + countryListStr;
					}

					/*
					if($scope.searchCriteria.countryListValue != '' && $scope.searchCriteria.countryListValue != undefined)
					{
						
						var tmpParams = $scope.searchCriteria.countryListValue;
						 var countryListStr = '';
						 for(var j=0;j<tmpParams.length;j++)
						 {	
							subParams = tmpParams[j].split(':');							
							if(countryListStr == '')
							{
								countryListStr += subParams[1];
							}
							else
							{
								countryListStr += '||'+subParams[1];
							}
							
							
						 }  
						 srchStr += '&SearchCountry='+countryListStr;					
					}
					*/

					if ($scope.setMeetingPage > 0 && $scope.setMeetingPage != '') {
						srchStr += '&page=' + $scope.setMeetingPage;
					}

					srchStr += '&liveSiteYN=' + vdsServices.isLiveSite();


					var fundInfo = $scope.searchCriteria.fundValue;
					var displayNotesTypeInfo = $scope.customerPreference.DisplayNotesTypeID;


					//console.log('meeting list'+$("#list"));

					$.extend(jQuery.jgrid.defaults, {
						prmNames: {
							sort: "SortByColumn", order: "OrderBy"
						}
					});

					// Moving the arrows of sorting to the left side
					/*jQuery.jgrid.extend({
						moveSortArrows: function (){
							// Moving only sorted cols
							// We must check style rule, because we can not use :hidden selector since this selector 
							// return true if width and height equal 0
							// For more information see official documentations - http://api.jquery.com/hidden-selector/
							$('.ui-jqgrid-sortable:has(span.s-ico:not([style*="display:none"]))').each(
								function() {
									// Add left padding for moving arrows
									$(this).css('padding-left', '16px');
									// Moving arrows
									$(this).find('span.s-ico').css({
										"position": "absolute",
										"left": 0
									});
								}
							);
						}
					});*/



					$('#list').jqGrid('GridUnload');
					grid = $("#list"),
						getUniqueNames = function(columnName) {
							var texts = grid.jqGrid('getCol', columnName), uniqueTexts = [],
								textsLength = texts.length, text, textsMap = {}, i;
							for (i = 0; i < textsLength; i++) {
								text = texts[i];
								if (text !== undefined && textsMap[text] === undefined) {
									// to test whether the texts is unique we place it in the map.
									textsMap[text] = true;
									uniqueTexts.push(text);
								}
							}
							return uniqueTexts;
						},
						buildSearchSelect = function(uniqueNames) {
							var values = ":All";
							$.each(uniqueNames, function() {
								values += ";" + this + ":" + this;
							});
							return values;
						},
						setSearchSelect = function(columnName) {
							/*console.log(columnName);
							console.log(getUniqueNames(columnName));
							console.log(buildSearchSelect(getUniqueNames(columnName)));*/
							grid.jqGrid('setColProp', columnName,
								{
									stype: 'select',
									searchoptions: {
										value: buildSearchSelect(getUniqueNames(columnName)),
										sopt: ['eq']
									}
								}
							);
						};
					
					if ($scope.debugMode == 'old') {
						var vdsMeetingListURL = vdsServices.getBaseURL() + 'vds/api/getVdsData/5?customerID=' + $routeParams.id + '&fromDate=' + $scope.searchCriteria.fromDate + '&toDate=' + $scope.searchCriteria.toDate + srchStr + '&random=' + Math.random();
						//url for downloading template
						vdsDownloadMeetingListURL = vdsServices.getBaseURL() + 'vds/api/downloadTemplate/5?customerID=' + $routeParams.id + '&fromDate=' + $scope.searchCriteria.fromDate + '&toDate=' + $scope.searchCriteria.toDate + srchStr + '&random=' + Math.random();
						vdsDownloadMeetingDetailURL = vdsServices.getBaseURL() + 'vds/api/downloadMeetingDetailTemplate?customerID=' + $routeParams.id + '&fromDate=' + $scope.searchCriteria.fromDate + '&toDate=' + $scope.searchCriteria.toDate + srchStr + '&random=' + Math.random();
						if (map != null && map != undefined) {
							if(Array.isArray(map)){
								map.forEach(function(item){
									vdsMeetingListURL = vdsMeetingListURL + '&' + item.key + '=' + item.value;
									vdsDownloadMeetingListURL = vdsDownloadMeetingListURL + '&' + item.key + '=' + item.value;
									vdsDownloadMeetingDetailURL = vdsDownloadMeetingDetailURL + '&' + item.key + '=' + item.value;
								});
							} else{
								vdsMeetingListURL = vdsMeetingListURL + '&' + map.key + '=' + map.value;
								vdsDownloadMeetingListURL = vdsDownloadMeetingListURL + '&' + map.key + '=' + map.value;
								vdsDownloadMeetingDetailURL = vdsDownloadMeetingDetailURL + '&' + map.key + '=' + map.value;
							}
						}
						else {
							$scope.actualUrl = vdsMeetingListURL;
							$scope.meetingListTemplateUrl = vdsDownloadMeetingListURL;
							$scope.meetingDetailTemplateUrl = vdsDownloadMeetingDetailURL;
						}
					}
					else {
						var vdsMeetingListURL = vdsServices.getBaseURL() + 'vds/api/getVdsData/14?customerID=' + $routeParams.id + '&fromDate=' + $scope.searchCriteria.fromDate + '&toDate=' + $scope.searchCriteria.toDate + srchStr + '&random=' + Math.random() + '&locale=' + getLanguageFromUrl();
						//url for downloading template
						vdsDownloadMeetingListURL = vdsServices.getBaseURL() + 'vds/api/downloadTemplate/14?customerID=' + $routeParams.id + '&fromDate=' + $scope.searchCriteria.fromDate + '&toDate=' + $scope.searchCriteria.toDate + srchStr + '&random=' + Math.random();
						vdsDownloadMeetingDetailURL = vdsServices.getBaseURL() + 'vds/api/downloadMeetingDetailTemplate?customerID=' + $routeParams.id + '&fromDate=' + $scope.searchCriteria.fromDate + '&toDate=' + $scope.searchCriteria.toDate + "&signVote="+vdsAppHelper.getSignificantVoteFilterQueryParam() + srchStr + '&random=' + Math.random();
						if (map != null && map != undefined) {
							if(Array.isArray(map)){
								map.forEach(function(item){
									vdsMeetingListURL = vdsMeetingListURL + '&' + item.key + '=' + item.value;
									vdsDownloadMeetingListURL = vdsDownloadMeetingListURL + '&' + item.key + '=' + item.value;
									vdsDownloadMeetingDetailURL = vdsDownloadMeetingDetailURL + '&' + item.key + '=' + item.value;
								});
							} else{
								vdsMeetingListURL = vdsMeetingListURL + '&' + map.key + '=' + map.value;
								vdsDownloadMeetingListURL = vdsDownloadMeetingListURL + '&' + map.key + '=' + map.value;
								vdsDownloadMeetingDetailURL = vdsDownloadMeetingDetailURL + '&' + map.key + '=' + map.value;
							}
							vdsMeetingListURL+="&actionCode=119&sessionToken="+loggerHelperConfig.sessionToken;
						}
						else {
							$scope.actualUrl = vdsMeetingListURL;
							$scope.meetingListTemplateUrl = vdsDownloadMeetingListURL;
							$scope.meetingDetailTemplateUrl = vdsDownloadMeetingDetailURL;
						}
					}
					//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [START]
					var indexOfSignificantMeeting = colNamesMeetingList.indexOf("Significant Meeting");

					if(indexOfSignificantMeeting>-1){
						if($scope.customerPreference.SignificantMeetingTypeID===1) {
							colModelMeetingList[indexOfSignificantMeeting]["hidden"] = true;
						} else if($scope.customerPreference.SignificantMeetingTypeID===3){
							colNamesMeetingList[indexOfSignificantMeeting] = "Significant Vote";
						} else if($scope.customerPreference.SignificantMeetingTypeID===4){
							colNamesMeetingList[indexOfSignificantMeeting] = "Significant Meeting/Vote";
						}
						colNamesMeetingList[indexOfSignificantMeeting] = vdsAppHelper.getLangProperty(colNamesMeetingList[indexOfSignificantMeeting]);
					}
					//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]

					grid.jqGrid({
						//data: mydata,
						//datatype: 'local',
						//url:vdsServices.getBaseURL() + 'vdsapi/getVdsData/5?customerID='+ $routeParams.id +'&fromDate='+$scope.parent.fromDate+'&toDate='+$scope.parent.toDate+srchStr,
						url: vdsMeetingListURL,
						datatype: "json",
						onPaging: function (pgButton) {
							var tempActionCode = 113;
							if (pgButton === "next") {
								tempActionCode = 111;
							} else if (pgButton === "prev") {
								tempActionCode = 112;
							}
							$(this).jqGrid("getGridParam").postData.actionCode = tempActionCode;
						},
						jsonReader: {
							repeatitems: false,
							root: function(data) {
								//the actual data					
								var result = data;
								// VDS-990 - Cache meeting information - [START]
								vdsAppHelper.meetingsStore = {};
								// VDS-990 - Cache meeting information - [END]
								if (result.data !== undefined) {
									for (i = 0; i < result.data.length; i++) {
										// VDS-990 - Cache meeting information - [START] -VDS-1391
										vdsAppHelper.meetingsStore[result.data[i].MeetingID] = {IsWFTSignMeeting:result.data[i].IsWFTSignMeeting,AllSignProposal:result.data[i].AllSignProposal,
										SignificantMeeting:result.data[i].SignificantMeeting,
										HasSignProp:result.data[i].HasSignProp, Cusips:result.data[i].CUSIPList, Isins:result.data[i].ISINList,};
										// VDS-990 - Cache meeting information - [END] -VDS-1391
										if(result.data[i].MeetingType!=undefined && result.data[i].MeetingType!='' && vdsServices.getPreferLanguageProperties()[result.data[i].MeetingType.trim()] != undefined){
										result.data[i].MeetingType = vdsServices.getPreferLanguageProperties()[result.data[i].MeetingType.trim()];
										}
										
                    result.data[i].VoteFlag = (vdsServices.getPreferLanguageProperties()[result.data[i].VoteFlag] == undefined ) ?  result.data[i].VoteFlag : vdsServices.getPreferLanguageProperties()[result.data[i].VoteFlag]; 
										
										//SignificantMeeting values translation
										result.data[i].SignificantMeeting  = (vdsServices.getPreferLanguageProperties()[result.data[i].SignificantMeeting] == undefined ) ?  result.data[i].SignificantMeeting : vdsServices.getPreferLanguageProperties()[result.data[i].SignificantMeeting];
                    
                    result.data[i].Country  = (vdsServices.getPreferLanguageProperties()[result.data[i].Country] == undefined ) ?  result.data[i].Country : vdsServices.getPreferLanguageProperties()[result.data[i].Country];
									}
								}
								return result.data;
							},
							total: function(data) {
								//total pages for the query
								//var result = parseResponse(data);
								//var pageTotal = (data.data.length)/20;

								//if(data && typeof data.data != 'undefined')															
								if (JSON.stringify(data) == '{}' || data.data === "") {
									$scope.$apply(function() {
										$scope.meetingTableData = 0;

										if ($scope.siteFormat != 'dashboard') {
											$scope.dashboardData = 0;
										}

									});
									return 0;
								}
								else {
									var pageTotal = (data.data[0].TotalRows) / 20;
									if (pageTotal > parseInt(pageTotal))
										pageTotal = pageTotal + 1;

									//MeetingTypeList = data.data[0].MeetingTypeList;


									$('#PageVal').val(parseInt(pageTotal));

									$scope.$apply(function() {
										$scope.meetingTableData = 1;
										if ($scope.siteFormat != 'dashboard') {
											$scope.dashboardData = 0;
											$scope.showDashboard = true;
										}
									});


									return parseInt(pageTotal);
								}


							},
							page: function(data) {
								//current page of the query
								//var result = parseResponse(data);
								//return result.currentPage;

								//alert(JSON.stringify(data));
								//if(data != 'undefined' && typeof data.data != 'undefined')

								if (JSON.stringify(data) == '{}' || data.data === "") {
									$scope.$apply(function() {
										$scope.meetingTableData = 0;
										if ($scope.siteFormat != 'dashboard') {
											$scope.dashboardData = 0;
											$scope.showDashboard = true;
										}
									});
									return 0;

								}
								else {
									return data.data[0].PageNumber;
								}

								//return 1;
							},
							records: function(data) {
								//total number of records for the query
								//var result = parseResponse(data);
								//return result.totalRecords;

								//if(data && typeof data.data != 'undefined')
								if (JSON.stringify(data) == '{}' || data.data === "") {
									$scope.$apply(function() {
										$scope.meetingTableData = 0;
									});
									return 0;

								}
								else {
									return data.data[0].TotalRows;
								}
								//return data.data.length;
							}
						},						
						colNames: colNamesMeetingList,
						colModel: colModelMeetingList,
						onSortCol: function(index, columnIndex, sortOrder) {
							//alert(index);
							//return 'stop';	//this stops the sorting of column
							var sortColumnName = $("#list").jqGrid('getGridParam', 'sortname');
							var sortOrder = $("#list").jqGrid('getGridParam', 'sortorder');
							var sortName = "jqgh_" + sortColumnName;
							$(this).jqGrid("getGridParam").postData.actionCode = 102;

							$('#' + sortName).css('padding-left', '21px');


							$(".ui-grid-ico-sort").each(function(index, value) {

								if ($(this).hasClass("ui-state-disabled")) {
									$(this).css('display', 'none');
								}

								if (!$(this).hasClass("ui-state-disabled")) {
									if ($(this).hasClass("ui-icon-asc")) {
										$(this).removeClass("ui-grid-ico-sort ui-icon-asc ui-icon ui-icon-triangle-1-n ui-sort-ltr").addClass("list-icon-sort-asc glyphicon glyphicon-arrow-up");
										//$(this).css('display','inline');									
									}

									if ($(this).hasClass("ui-icon-desc")) {
										$(this).removeClass("ui-grid-ico-sort ui-icon-desc ui-icon ui-icon-triangle-1-s ui-sort-ltr").addClass("list-icon-sort-desc glyphicon glyphicon-arrow-down");
										//$(this).css('display','inline');									
									}
								}

							});

							//$('#'+sortName +' span span').each(function(index, value) 
							//$('#'+sortName +' span span','#list_'+sortName).each(function(index, value) 
							//#list_'+sortName
							//$('#'+sortName +' span span').each(function(index, value) 
							$('#list_' + sortColumnName).find('#' + sortName + ' span span').each(function(index, value) {

								if ($(this).attr('sort') == sortOrder) {
									$('#' + sortName).css('padding-left', '21px');
									$(this).css('display', 'inline');

								}
								else {
									$(this).css('display', 'none');
								}

							});






						},
						onCellSelect: function(cellvalue, options, rowObject) {
							var str = "" + cellvalue + "";
							//return "<a href=javascript:showMeetingDetail(this,"+rowObject.MeetingID+")>"+ str  +"</a>";
						},
						//sortname: 'CompanyName',
						sortname: colMeetingListColumnSort,
						viewrecords: true,
						recordtext: vdsServices.getPreferLanguageProperties().recordtext,
						rownumbers: false,
						sortorder: "asc",
						ignoreCase: true,
						pager: '#pager',
						height: "auto",
						MeetingTypeList: '',
						CountryList: '',
						VotedList: '',
						FundInfo: fundInfo,
						EncodedCustomerID: EncodedCustomerID,
						CustomerID: CustomerID,
						//var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');					
						DisplayNotesTypeInfo: displayNotesTypeInfo,
						postData:
						{
							MeetingTypeList: '',
							CountryList: '',
							VotedList: '',
							actionCode: loggerHelperConfig.actionCode,
							sessionToken: loggerHelperConfig.sessionToken
						},
						//caption: "VDS",
						hiddengrid: true,
						rowNum: 20,
						altRows: true,
						altclass: 'AlternateRowClass',
						//shrinkToFit: true,
						//autowidth: true, 
						//height: '100%',
						beforeRequest: function() {
							var x = $('#gview_list').css('height').replace('px', '') / 4;
							$('#load_list').css('margin-top', -x);
							$('.loading').show();
						},
						loadui: "block",
						gridview: true,
						loadtext: "<img src='/repo/app/img/bigrotation.gif'><span style='font-size: 20px; vertical-align:middle; padding-left: 5px'>" + vdsServices.getPreferLanguageProperties().Loading + "...</span>",
						beforeSelectRow: function(rowid, e) {
							return false;
						},
						//fromDate: '',	
						//toDate: '',
						//filterName: '',
						//filterValue: '',
						/*onPaging: function (pgButton) {
						
							$('#meetingListGrid').width('100%');
							$("#listDetail").closest('.ui-jqgrid-bdiv').width($("#listDetail").closest('.ui-jqgrid-bdiv').width()+1);
							
							var outerwidth = $('#meetingListGrid').width();													
							$('#listDetail').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically						
							$('#meetingListGrid').width($('#meetingListGrid').width()+2);
							console.log('paging');	
						},*/
						loadError: function(xhr, status, error) {
							vdsAppHelper.handleRedirectionForXhr(xhr);
							currentGridRequest = undefined;
						},
						loadComplete: function(data) {
							currentGridRequest = undefined;
						},
						loadBeforeSend: function(xhr, settings) {
							if (currentGridRequest !== undefined) {
								currentGridRequest.abort();
							}
							currentGridRequest = xhr;
						},
						gridComplete: function() {
							//$(window).trigger('resize');

							$('#meetingDisplayGrid').width('100%');
							//console.log($("#MeetingType_list").width()+'=>'+$("#meetingDisplayGrid").width());
							$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width() + 1);
							/*//$("#list_VoteFlag").css('width','109px');						
							var t_width = $("#list_VoteFlag").css('width');
							t_width = t_width.replace('px','');
							t_width = parseInt(t_width)+2;
							//$("#list_VoteFlag").css('width',t_width+'px');
							*/

							var outerwidth = $('#meetingDisplayGrid').width();
							//	console.log('meeting Display' + outerwidth);	
							$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically

							$('#meetingDisplayGrid').width($('#meetingDisplayGrid').width() + 2);
							//	console.log($('#meetingDisplayGrid').width());

							var recs = parseInt($("#list").getGridParam("records"), 10);

							$('.jqgrow').mouseover(function(e) {

								var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
								if (FundInfoGrid == null) {
									FundInfoGrid = '';
								}

								var rowId = $(this).attr('id');
								var dataFromTheRow = jQuery("#list").jqGrid('getRowData', rowId);



								if (dataFromTheRow.MultipleFundIDs != '') {
									MultipleFundIDs = dataFromTheRow.MultipleFundIDs.split(', ');
									MultipleFundIDs = MultipleFundIDs.join('||')
								}


								var MultipleBallotIDs = '';
								if (dataFromTheRow.MultipleBallotIDs != '') {
									MultipleBallotIDs = dataFromTheRow.MultipleBallotIDs.split(', ');
									MultipleBallotIDs = MultipleBallotIDs.join('||')
								}

								var SignificantMeeting = '';
								if (dataFromTheRow.SignificantMeeting != '') {
									SignificantMeeting = dataFromTheRow.SignificantMeeting;		
								}
								
								var voteDetailsList = JSON.stringify(vdsServices.getPreferLanguageProperties().voteDetailsList).replace(/'/g, "\\'");
								var meetingDetailProponentList = JSON.stringify(vdsServices.getPreferLanguageProperties().meetingDetailProponentList).replace(/'/g, "\\'");
								var meetingTypeDetailList = JSON.stringify(vdsServices.getPreferLanguageProperties().meetingTypeDetailList).replace(/'/g, "\\'");
								var propsalCategoryList = JSON.stringify(vdsServices.getPreferLanguageProperties()).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
								$(this).attr('onClick', "javascript:showMeetingDetail(this,'" + dataFromTheRow.MeetingID + "','" + SignificantMeeting + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + 
								"','" + voteDetailsList + "','" + meetingTypeDetailList + "','" + meetingDetailProponentList + "','" + vdsServices.getCommonOrCustomLanguage() + "' ,'" + propsalCategoryList + "')");
								$(this).css('cursor', 'pointer');

								//console.log("JSON");
								//console.log(JSON.stringify(vdsServices.getPreferLanguageProperties());

							});

							$("#next").mouseover(function() {
								$(this).removeClass("ui-state-hover");
							});

							$("#prev").mouseover(function() {
								$(this).removeClass("ui-state-hover");
							});


							if (isNaN(recs) || recs <= 0) {
								$("#gbox_list").hide();
								//alert('no records found');
								$("#resetMeetingListfilter").show();
							}
							else {
								//$('#gridWrapper').show();
								//alert('records > 0');
								$("#resetMeetingListfilter").hide();

								createDropdown(vdsServices.getPreferLanguageProperties().pgof, vdsServices.getPreferLanguageProperties().pgtext);



								var meetingTypeStr = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');
								var countryListStr = jQuery("#list").jqGrid('getGridParam', 'CountryList');
								var votedListStr = jQuery("#list").jqGrid('getGridParam', 'VotedList');


								if (meetingTypeStr == '') {
									$("#jqgh_MeetingType span:first").addClass("ui-state-disabled");
								}
								else {
									$("#jqgh_MeetingType span:first").removeClass("ui-state-disabled");
								}

								if (countryListStr == '') {
									$("#jqgh_Country span:first").addClass("ui-state-disabled");
								}
								else {
									$("#jqgh_Country span:first").removeClass("ui-state-disabled");
								}

								if (votedListStr == '') {
									$("#jqgh_VoteFlag span:first").addClass("ui-state-disabled");
								}
								else {
									$("#jqgh_VoteFlag span:first").removeClass("ui-state-disabled");
								}

								/*
								if(meetingTypeStr != '' || countryListStr != '' || votedListStr != '')
								{
									$("#resetMeetingListfilter").show();
								}
								else
								{
									$("#resetMeetingListfilter").hide();
								}
								*/
								$scope.showNewNextPrevButton = $scope.getCustomOrCommonData($scope.customDashboardProperties.showNewNextPrevButton, $scope.commonDashboardProperties.showNewNextPrevButton);
								//console.log($scope.showNewNextPrevButton);
								if ($scope.showNewNextPrevButton == "true") {
									//$("#next span").removeClass( "ui-icon ui-icon-seek-next").addClass( "custom-icon-next" );
									$("#next span").removeClass("ui-icon ui-icon-seek-next").addClass("vds-icon-next");

									$('<style>.vds-icon-next:before { content:"' + vdsServices.getPreferLanguageProperties().next + '"; }</style>').appendTo('body');

									//$("#prev span").removeClass( "ui-icon ui-icon-seek-prev").addClass( "custom-icon-prev" );
									$("#prev span").removeClass("ui-icon ui-icon-seek-prev").addClass("vds-icon-prev");

									$('<style>.vds-icon-prev:after { content:"' + vdsServices.getPreferLanguageProperties().prev + '"; }</style>').appendTo('body');
								}
								else {


									$("#next span").removeClass("ui-icon ui-icon-seek-next").addClass("custom-icon-next");

									//$("#prev span").removeClass( "ui-icon ui-icon-seek-prev").addClass( "custom-icon-prev" );
									$("#prev span").removeClass("ui-icon ui-icon-seek-prev").addClass("custom-icon-prev");
								}
								$("#first").hide();
								$("#last").hide();
								//$("#pager_right").html('');

								var sortColumnName = $("#list").jqGrid('getGridParam', 'sortname');
								var sortOrder = $("#list").jqGrid('getGridParam', 'sortorder');
								var sortName = "jqgh_" + sortColumnName;
								//$('#'+sortName +' span').each(function(index, value)

								$(".ui-grid-ico-sort").each(function(index, value) {

									if ($(this).hasClass("ui-state-disabled")) {
										$(this).css('display', 'none');
									}

									if (!$(this).hasClass("ui-state-disabled")) {
										if ($(this).hasClass("ui-icon-asc")) {
											$(this).removeClass("ui-grid-ico-sort ui-icon-asc ui-icon ui-icon-triangle-1-n ui-sort-ltr").addClass("list-icon-sort-asc  glyphicon glyphicon-arrow-up");
											//$(this).css('display','inline');									
										}

										if ($(this).hasClass("ui-icon-desc")) {
											$(this).removeClass("ui-grid-ico-sort ui-icon-desc ui-icon ui-icon-triangle-1-s ui-sort-ltr").addClass("list-icon-sort-desc  glyphicon glyphicon-arrow-down");
											//$(this).css('display','inline');									
										}
									}

								});


								$('#' + sortName + ' span span').each(function(index, value) {
									//console.log($(this).attr('sort'));

									if ($(this).attr('sort') == sortOrder) {
										//$('#'+sortName).css('padding-left', '21px');
										$(this).css('display', 'inline');

									}
									else {
										$(this).css('display', 'none');
									}

								});


								//$('#jqgh_'+sortName +' span[class=s-ico]').css('padding-left', '21px !important');
								//console.log(sortName);

								if (sortName == 'jqgh_CompanyName') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_CompanyName').css('padding-left', '0px');
								}

								if (sortName == 'jqgh_Ticker') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_Ticker').css('padding-left', '0px');
								}

								if (sortName == 'jqgh_MeetingDate') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_MeetingDate').css('padding-left', '0px');
								}

								if (sortName == 'jqgh_SecurityID') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_SecurityID').css('padding-left', '0px');
								}

								if (sortName == 'jqgh_VoteFlag') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_VoteFlag').css('padding-left', '0px');
								}


								if (sortName == 'jqgh_FundName') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_FundName').css('padding-left', '0px');
								}

								if (sortName == 'jqgh_MeetingType') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_MeetingType').css('padding-left', '0px');
								}

								if (sortName == 'jqgh_Country') {
									$('#' + sortName).css('padding-left', '21px');
								}
								else {
									$('#jqgh_Country').css('padding-left', '0px');
								}



								var listLength = $('#list tr').length - 1;
								$('#list tr').each(function() {

									//console.log($(this).attr('id'));
									var company_Title = $(this).find("td[aria-describedby='list_CompanyName']").attr('title');
									var fund_Title = $(this).find("td[aria-describedby='list_FundName']").attr('title');
									var fundFootSymbol_TitleTmp = $(this).find("td[aria-describedby='list_FundFootnoteSymbol']").attr('title');
									var mFootNote_Title = $(this).find("td[aria-describedby='list_MeetingFootnoteText']").attr('title');
									var meetingFootSymbol_Title = $(this).find("td[aria-describedby='list_MeetingFootnoteSymbol']").attr('title');
									var fFootNote_TitleTmp = $(this).find("td[aria-describedby='list_FundFootnoteText']").attr('title');

									if (fund_Title !== undefined && fund_Title != 'Multiple' && fFootNote_TitleTmp !== undefined) {
										var fFootNote_TitleSplit = fFootNote_TitleTmp.split(' ** ');
										var fFootNote_Title = fFootNote_TitleSplit[1];
										if(fFootNote_Title != '' && fFootNote_Title != null) {
											fFootNote_Title = fFootNote_Title.trim();
										}

										var fFootNoteSymbol_TitleSplit = fundFootSymbol_TitleTmp.split(' ** ');
										var fFootNoteSymbol_Title = fFootNoteSymbol_TitleSplit[1];
									}
									else {
										var fFootNote_Title = null;
									}

									if (company_Title !== undefined && mFootNote_Title != null && mFootNote_Title != '' && mFootNote_Title != undefined) {
										//$(this).find("td[aria-describedby='list_CompanyName']").attr('title',meetingFootSymbol_Title+' '+mFootNote_Title);	//if exists, append meeting footnote to title of company name
										$(this).find("td[aria-describedby='list_CompanyName']").attr('title', '');	//if exists, append meeting footnote to title of company name
										if (meetingFootSymbol_Title == undefined)
											meetingFootSymbol_Title = '';
										var tooltipText = meetingFootSymbol_Title + ' ' + mFootNote_Title;
										//$(this).find("td[aria-describedby='list_CompanyName']").attr('onMouseOver','showGridTooltip("'+tooltipText+'",event)');
										//$(this).find("td[aria-describedby='list_CompanyName']").attr('onMouseOut','hideGridTooltip()');
										$(this).find("td[aria-describedby='list_CompanyName']").attr('onMouseOver', 'showGridTooltip(this,"' + tooltipText + '",event)');
										$(this).find("td[aria-describedby='list_CompanyName']").attr('onMouseOut', 'hideGridTooltip(this)');

										if (listLength == 20 && $(this).attr('id') == 20) {
											$(this).find("td[aria-describedby='list_CompanyName']").html(company_Title + '<span class="gridTooltipClass dummyPosition" style="">' + tooltipText + '</span>');
										}
										else {
											if (listLength < 5 && ($(this).attr('id') == 1 || $(this).attr('id') == 2 || $(this).attr('id') == 3)) {
												$(this).find("td[aria-describedby='list_CompanyName']").html(company_Title + '<span class="gridTooltipClass" style="top: 0px; left: 150px; height: 35px;">' + tooltipText + '</span>');
											}
											else {
												$(this).find("td[aria-describedby='list_CompanyName']").html(company_Title + '<span class="gridTooltipClass">' + tooltipText + '</span>');
											}
										}

										//$(this).find("td[aria-describedby='list_CompanyName']").html(company_Title+'<span class="gridTooltipClass">'+tooltipText+'</span>');


									}
									if (fund_Title !== undefined && fFootNote_Title != null && fFootNote_Title !== undefined && fund_Title !== undefined && fund_Title != 'Multiple') {
										//$(this).find("td[aria-describedby='list_FundName']").attr('title',fFootNoteSymbol_Title+' '+fFootNote_Title);	//if exists, append fund footnote to title of fund name
										$(this).find("td[aria-describedby='list_FundName']").attr('title', '');	//if exists, append fund footnote to title of fund name
										if (fFootNoteSymbol_Title == undefined)
											fFootNoteSymbol_Title = '';
										var tooltipText = fFootNoteSymbol_Title + ' ' + fFootNote_Title;
										$(this).find("td[aria-describedby='list_FundName']").attr('onMouseOver', 'showGridTooltip(this,"' + tooltipText + '",event)');
										$(this).find("td[aria-describedby='list_FundName']").attr('onMouseOut', 'hideGridTooltip(this)');


										if (listLength == 20 && $(this).attr('id') == 20) {
											$(this).find("td[aria-describedby='list_FundName']").html(fund_Title + '<span class="gridTooltipClass dummyPosition" style="">' + tooltipText + '</span>');
										}
										else {
											if (listLength < 5 && ($(this).attr('id') == 1 || $(this).attr('id') == 2 || $(this).attr('id') == 3)) {
												$(this).find("td[aria-describedby='list_FundName']").html(fund_Title + '<span class="gridTooltipClass" style="top: 0px; left: 450px; height: 35px;">' + tooltipText + '</span>')
											}
											else {
												$(this).find("td[aria-describedby='list_FundName']").html(fund_Title + '<span class="gridTooltipClass" style="">' + tooltipText + '</span>');
											}
										}
									}

									//console.log(company_Title + '=>'+ mFootNote_Title)	;

									//console.log($(this).attr('id') + '==>'+ listLength);


								});


								/*
								$('.ui-jqgrid-sortable:has(span.s-ico:not([style*="display:none"]))').each(
									function() {
										// Add left padding for moving arrows
										$(this).css('padding-left', '16px');
										// Moving arrows
										$(this).find('span.s-ico').css({
											"position": "absolute",
											"left": 0
										});
									}
								);
								*/



							}



						}
					}).jqGrid('navGrid', '#pager',
						{ edit: false, add: false, del: false, search: false, refresh: false });

					/*setSearchSelect('FundFamilyID');
					setSearchSelect('FundFamilyName');*/
					//setSearchSelect('Subcategory');
					grid.jqGrid('setColProp', 'CompanyName',
						{
							searchoptions: {
								sopt: ['cn'],
								dataInit: function(elem) {
									$(elem).autocomplete({
										source: getUniqueNames('CompanyName'),
										delay: 0,
										minLength: 0
									});
								}
							}
						});

					/*grid.jqGrid('filterToolbar',
                        {stringResult:true, searchOnEnter:true, defaultSearch:"cn"});*/
				};


				//$('#list').on('reloadGrid', adjustWidth_MeetingList());

				$(window).resize(function() {
					if ($("#meetingDisplayGrid").css("display") == 'block') {
						$('#meetingDisplayGrid').width('100%');
						adjustWidth_MeetingList();
					}

				});


				



				$('#meetingType_Image').click(function() {
					alert('You Clicked Me');
				});



				function adjustWidth_MeetingList() {

					var outerwidth = $('#meetingDisplayGrid').width();
					//console.log(outerwidth);										
					$('#' + vdsServices.getgraphSectionSelected()).setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically
					//$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width()+1);
					$('#meetingDisplayGrid').width($('#meetingDisplayGrid').width() + 2);


				}




				function createDropdown(pageOf, pageTxt) {
					var a = $('#PageVal').val();
					var curPage = $('#list').getGridParam('page');
					if (curPage == '' || curPage <= 0) {
						curPage = 1;
					}
					if (a > 0) {

						var str = pageTxt + ' <select id="PageDropdown" style="" onchange="javascript: callGrid();">';
						var i = 1;
						while (i <= a) {
							if (i == curPage) {
								str += '<option value="' + i + '" selected>' + i + '</option>'
							}
							else {
								str += '<option value="' + i + '">' + i + '</option>'
							}

							i++;
						}

						str += '</select> ' + pageOf + ' ' + a;

						$('td[dir=ltr]').empty()
							.append(str);

					}
				}

				function meetingFormatter(cellvalue, options, rowObject) {
					var str = "" + cellvalue + "";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}

					//rowObject.MeetingFootnoteSymbol = 'test ** $%';		
					if (rowObject.MeetingFootnoteSymbol != '') {
						var mFootNoteSymbol = rowObject.MeetingFootnoteSymbol;
						str += '' + mFootNoteSymbol;
					}

					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}


					//console.log(rowObject);
					//$("#list").setCell(rowObject.RowNumber,'CompanyName','','',{'title':'my custom tooltip on cell'});
					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";

				}

				function meetingCellattr(rowId, val, rawObject, cm, rdata) {
					var str = "" + cellvalue + "";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}
					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";		
					return 'class="testClass"';
				}

				function meetingFormatter_Ticker(cellvalue, options, rowObject) {
					var str = "" + cellvalue + "";

					if (cellvalue == null || cellvalue == '(Blanks)') {
						str = '';
					}
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}

					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}
					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";
					//return str;
				}

				function setMeetingDetail(cellvalue, options, rowObject) {
					var str = "" + cellvalue + "";
					if (cellvalue == null) {
						str = '';
					}
					//return "<a href=javascript:showMeetingDetail(this,"+rowObject.MeetingID+")>"+ str  +"</a>";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}

					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}

					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";
					//return str;
				}

				/*function setMeetingDetail(rowId, tv, rawObject, cm, rdata) 
				{
					if (Number(tv)>200) {
						return ' onClick="showReceivedLockedPieChartDialog(' + '\'' +
							rowId + '\'' + ')" style="background-color:red"';
					} else {
						return 'style="color:black"';
					}
				}*/



				function meetingFormatter_Fund(cellvalue, options, rowObject) {
					var str = "" + cellvalue + "";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}

					if (str != 'Multiple') {
						//rowObject.FundFootnoteSymbol = 'test ** $%';
						if (rowObject.FundFootnoteSymbol != null && rowObject.FundFootnoteSymbol.trim() != '') {
							var fFootNoteSymbol_txt = rowObject.FundFootnoteSymbol.split(' ** ');
							if (fFootNoteSymbol_txt.length > 0) {
								var fFootNoteSymbol = fFootNoteSymbol_txt[1];
								str += '' + fFootNoteSymbol;
							}
						}
					}

					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}

					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";
					//return str;
				}

				function meetingFormatter_Type(cellvalue, options, rowObject) {
					if (cellvalue == 'Unknown' || cellvalue == '(Blanks)') {
						cellvalue = '';
					}
					var str = "" + cellvalue + "";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}

					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}

					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";
					//return str;
				}

				function meetingFormatter_Country(cellvalue, options, rowObject) {
					if (cellvalue == 'Unknown' || cellvalue == '(Blanks)') {
						cellvalue = '';
					}
					var str = "" + cellvalue + "";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}

					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}

					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";
					//return str;
				}

				function meetingFormatter_Status(cellvalue, options, rowObject) {
					if (cellvalue == 'Unknown' || cellvalue == '(Blanks)') {
						cellvalue = '';
					}
					var str = "" + cellvalue + "";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}

					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}

					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";
					//return str;
				}


				function dateFormatter(cellvalue, options, rowObject) {
					var str = cellvalue;
					str = str.replace(' 00:00:00.0', '');
					str = $filter('date')(str, "dd-MMM-yyyy");

					var str = "" + str + "";
					var FundInfoGrid = jQuery("#list").jqGrid('getGridParam', 'FundInfo');
					if (FundInfoGrid == null) {
						FundInfoGrid = '';
					}
					var MultipleFundIDs = '';
					if (rowObject.MultipleFundIDs != '') {
						MultipleFundIDs = rowObject.MultipleFundIDs.split(', ');
						MultipleFundIDs = MultipleFundIDs.join('||')
					}


					var MultipleBallotIDs = '';
					if (rowObject.MultipleBallotIDs != '') {
						MultipleBallotIDs = rowObject.MultipleBallotIDs.split(', ');
						MultipleBallotIDs = MultipleBallotIDs.join('||')
					}

					//return "<a href=javascript:showMeetingDetail(this,'"+rowObject.MeetingID+"','"+FundInfoGrid+"')>"+ str  +"</a>";	
					return "<a href=javascript:showMeetingDetail(this,'" + rowObject.MeetingID + "','" + MultipleFundIDs + "','" + MultipleBallotIDs + "')>" + str + "</a>";
					//return str;
				}


				function strFormatter(cellvalue, options, rowObject) {
					var str = "" + cellvalue + "";
					var n = str.length;
					var strDisplay;
					var numChar = 30;
					if (n > numChar) {
						strDisplay = str.substr(0, numChar) + "...";
					}
					else {
						strDisplay = str;
					}
					return strDisplay;
				}

				function setcolModelMeetingList(colModel_MeetingList) {

					var formattedJson = new Object;
					var jsonObj = colModel_MeetingList;

					var mc = 0;
					var x;

					for (x in jsonObj) {
						if (jsonObj[x].formatter != '') {
							jsonObj[x].formatter = eval(jsonObj[x].formatter);
						}
						mc++;
					}

					return jsonObj;
				}






				/*		    $scope.openPDF = function() {
				
								console.log('selected Charts : ' + selectedChartList);
								sessionStorage.voting = selectedChartList.voting;
								sessionStorage.votingDetails = selectedChartList.votingDetails;
								sessionStorage.proposalMgmt = selectedChartList.proposalMgmt;
								sessionStorage.proposalShareHolder = selectedChartList.proposalShareHolder;
								sessionStorage.industry = selectedChartList.industry;
								sessionStorage.meetingType = selectedChartList.meetingType;
								sessionStorage.country = selectedChartList.country;
				
								var tabWindowId = window.open('about:blank', '_blank');
				
								setTimeout(function() { // async
									tabWindowId.location.href = '#/pdfExport';
								}, 1001);
							};*/
							$scope.OpenPrintPopUp = function() {	
								$('#printmodal .modal-body').html(graphicsTitle);
								$('#printmodal').modal('show');
								if (vdsServices.getPreferLanguageProperties().Cancel != undefined) {
									$(".printbtn.printbtn-secondary").text("" + vdsServices.getPreferLanguageProperties().Cancel + "");
								}
								if (vdsServices.getPreferLanguageProperties().ExportButtonText != undefined) {
									$(".printbtn.printbtn-primary.print").text("" + vdsServices.getPreferLanguageProperties().ExportButtonText + "");
								}
							};
							meetingListColumnArray = $scope.customerPreference.MeetingListColumns.split('|');
							//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [START]
							vdsAppHelper.updateMeetingListColumnArraySignificant(meetingListColumnArray, $scope.customerPreference.SignificantMeetingTypeID);
							//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]
							$scope.pageSize = $scope.getCustomOrCommonData($scope.customDashboardProperties.pageSize, $scope.commonDashboardProperties.pageSize);
							$scope.downloadTemplate = function (graph) {
							        $( '#'+graph+' .dropdown-content' ).find('.meetingListExportLink').attr("disabled","disabled");
									$( '#'+graph+' .dropdown-content' ).find('.meetingListExportLink').append('<div class="dot-elastic"></div>');
									$('.addaleartmessage').append('<div class="alert alert-success '+graph+'listalert" ><button type="button" class="close" onclick="delAlertMessage(\''+graph+'listalert\')">×</button>'+downloadAlertMessage+'</div>');
									vdsDownloadMeetingListURL +="&actionCode=115&sessionToken="+loggerHelperConfig.sessionToken;
								$http({
									method: 'GET',
									responseType: 'arraybuffer',
									url: vdsDownloadMeetingListURL,
									params: {
										//MeetingTypeList: '',
										//CountryList: '',
										VotedList: '',
										rows: $scope.pageSize,
										page: 1,
										SortByColumn: colMeetingListColumnSort,
										OrderBy: "asc",
										meetingListColumns: meetingListColumnArray,
										locale: vdsServices.getlanguageUse()
									},
									headers: {
										'Accept': "application/vnd.ms-excel"
									}
								}).then(function(response) {
									var blob = new Blob([response.data], {
										type: 'application/vnd.ms-excel'
									});
									var fileName = response.headers("Content-Disposition").split(';')[1].trim().split('=')[1];
									FileSaver.saveAs(blob, fileName);
									$( '#'+graph+' .dropdown-content' ).find('.meetingListExportLink').removeAttr("disabled");
									$( '#'+graph+' .dropdown-content' ).find('.meetingListExportLink .dot-elastic').remove();
									$( '.'+graph+'listalert' ).remove();
								}, function error(response) {
									$( '#'+graph+' .dropdown-content' ).find('.meetingListExportLink').removeAttr("disabled");
									$( '#'+graph+' .dropdown-content' ).find('.meetingListExportLink .dot-elastic').remove();
									$( '.'+graph+'listalert' ).remove();
								});
							   }
							// VDS-990: Moved this code to vds-app.js - [START]   
							/*
							var uniqueColumns = [];
							var meetingListColumnsFromDb = $scope.customerPreference.MeetingListColumns.split('|');
							var meetingDetailColumns = MeetingDetailsColumnsForExport.split('|');
							var meetingDetailColumnArray = meetingListColumnsFromDb.concat(meetingDetailColumns);
							var displayNotesTypeID = $scope.customerPreference.DisplayNotesTypeID;
							if(displayNotesTypeID == 1)
							{
								meetingDetailColumnArray.push('notes');
							}
							else if(displayNotesTypeID == 2)
							{
								meetingDetailColumnArray.push('researchNotes');
							}
							else if(displayNotesTypeID ==3)
							{
								meetingDetailColumnArray.push('notes');
								meetingDetailColumnArray.push('researchNotes');
							}
							else if(displayNotesTypeID == 4)
							{
								meetingDetailColumnArray.push('blendedRationale');
							}
							else if(displayNotesTypeID == 5)
							{
								meetingDetailColumnArray.push('contextualNotes');
							}
							meetingDetailColumnArray.forEach(function(itm){
								rtn =  findUnique(itm, uniqueColumns);
								if(rtn==0)
								uniqueColumns.push(itm);
								});	
								if(uniqueColumns.indexOf("proposalCategory")>-1){
									uniqueColumns.push("proposalSubcategory");
								}
								//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [START]
								var indexOfSignificantVote = uniqueColumns.indexOf("significantVote");
								if(indexOfSignificantVote>-1 && $scope.customerPreference.SignificantMeetingTypeID===1){
									uniqueColumns.splice(indexOfSignificantVote,1);
								}
								//VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]
								*/
							// VDS-990: Moved this code to vds-app.js - [END]	
				$scope.downloadMeetingDetailTemplate = function(graph) {
					vdsAppHelper.vdsBodyAjScope.updateMeetingDetailURLParameter(vdsDownloadMeetingDetailURL,"signVote",vdsAppHelper.getSignificantVoteFilterQueryParam());
					 $( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink').attr("disabled","disabled");
					 $( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink').addClass('paddingLeft5pxImpo');
					 $( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink').append('<div class="dot-elastic"></div>');
					 $('.addaleartmessage').append('<div class="alert alert-success '+graph+'detailsalert" ><button type="button" class="close" onclick="delAlertMessage(\''+graph+'detailsalert\')">×</button>'+downloadAlertMessage+'</div>');
					 vdsDownloadMeetingDetailURL+="&actionCode=116&sessionToken="+loggerHelperConfig.sessionToken;					 
				$http({
					method: 'GET',
					responseType: 'arraybuffer',
					url: vdsDownloadMeetingDetailURL,
					params: {
						rows: $scope.pageSize,
						SortByColumn: 'CompanyName|SeqNumber',
						OrderBy: "asc",
						meetingDetailColumns: vdsAppHelper.getMeetingDetailsUniqueColumnsForExport(),
						displayNotesTypeID: $scope.customerPreference.DisplayNotesTypeID,
						locale: vdsServices.getlanguageUse()
					},
					headers: {
						'Accept': "application/vnd.ms-excel"
					}
				}).then(function(response) {
					var blob = new Blob([response.data], {
						type: 'application/vnd.ms-excel'
					});
					var fileName = response.headers("Content-Disposition").split(';')[1].trim().split('=')[1];
					FileSaver.saveAs(blob, fileName);
					$( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink').removeAttr("disabled");
					$( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink').removeClass('paddingLeft5pxImpo');
					$( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink .dot-elastic').remove();
					$( '.'+graph+'detailsalert' ).remove();
				}, function error(response) {
					$( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink').removeAttr("disabled");
					$( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink').removeClass('paddingLeft5pxImpo');
					$( '#'+graph+' .dropdown-content' ).find('.meetingDetailsExportLink .dot-elastic').remove();
                    $( '.'+graph+'detailsalert' ).remove();					
			    });
			}



			}],
			//templateUrl: vdsServices.getBaseURL() + 'repo/'+ vdsServices.getCustomerId() +'/directives/templates/'+vdsServices.bodyTemplate+'?version='+vdsServices.getCSSJSVersion()+'&random='+Math.random(),	
			//templateUrl: vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+'/'+ vdsServices.getCustomerId() +'/directives/templates/body.html?version='+vdsServices.getCSSJSVersion()+'&random='+Math.random(),
			templateUrl: function() {
				var templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/app/js/vds_components/templates/body.html?version=' + vdsServices.getCSSJSVersion();
				var customTemplateFile = vdsServices.getCustomProperties().bodyTemplate;
				if (customTemplateFile != '' && customTemplateFile != undefined) {
					if (customTemplateFile != 'global') {
						templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/templates/body.html?version=' + vdsServices.getCSSJSVersion();
					}
				}

				var commonTemplateFile = vdsServices.getDashboardProperties().bodyTemplate;
				if (commonTemplateFile != '' && commonTemplateFile != undefined) {
					if (commonTemplateFile != 'global') {
						templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/templates/body.html?version=' + vdsServices.getCSSJSVersion();
					}
				}

				return templateUrl;
			},
			link: function($scope, $element, $attrs, controller, $routeParams) {


				$scope.getDateValue();
				//@TODO : call get data only when the customer preference is to show the dashboard on load.
				//$('#spinnerDiv').show();

				

				setTimeout(function() {		//setting a delay of 50ms before making first call to graph and meeting list 						

					if ($scope.debugMode == 'old') {
						$scope.getData();	//original graph call
					}
					else {
						//$scope.getGraphsData();
						if ($scope.siteFormat == 'dashboard') // only call graphs if site format is dashboard
						{
							$scope.getGraphsData();	//new graph call 						

						}

						else {
							$scope.dashboardData = 0;	//set dashboardData for live site
						}


					}

					//$('#spinnerDiv').hide();		 
					$scope.getMeetingList();	//
				}, 50);

				//$('#spinnerDiv').hide();		 
				//$scope.getMeetingList();	//


				$scope.$watch('showDashboard', function() {
					if ($scope.showDashboard == true) {
						$(".datepickerClass,#toDatepicker,.fundSelectClass,#fundFamilySelect,.companyOrTickerClass,#generatePdf,.selectSignificantMeetings").removeAttr('disabled');
						$('.countryMultiSelectClass').multiselect('enable');
						$('.countryMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
						$('.countryMultiSelectClass').multiselect('updateSelectAll', true);
						$('.fundMultiSelectClass').multiselect('enable');
						$('.fundMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
						$('.fundMultiSelectClass').multiselect('updateSelectAll', true);
						$('.fundFamilyMultiSelectClass').multiselect('enable');
						$('.fundFamilyMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
						$('.fundFamilyMultiSelectClass').multiselect('updateSelectAll', true);
						
						//$('#spinnerDiv').hide(); 
					}
				});


				$scope.$watchGroup(['dashboardData', 'meetingTableData', 'isLoading'], function(newVal, oldVal) {
					if (newVal[0] > 20) {  //newVal[1]
						//$scope.matchStatus = 'win'; 
					}



					//console.log('scope....'+$scope.dashboardData+'=>'+$scope.meetingTableData);
					//console.log('$scope.isLoading....'+$scope.isLoading);
					//console.log('newVal....'+newVal[0]+'=>'+newVal[1]);			

					if ($scope.dashboardData != -1 && $scope.meetingTableData != -1) {

						if ($scope.dashboardData == 0 && $scope.meetingTableData == 1) {
							//console.log('condition matched');
							$(".datepickerClass,#toDatepicker,.fundSelectClass,#fundFamilySelect,.companyOrTickerClass,#generatePdf,.selectSignificantMeetings").removeAttr('disabled');
							$('.countryMultiSelectClass').multiselect('enable');
							$('.countryMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
							$('.countryMultiSelectClass').multiselect('updateSelectAll', true);
							$('.fundMultiSelectClass').multiselect('enable');
							$('.fundMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
							$('.fundMultiSelectClass').multiselect('updateSelectAll', true);
							$('.fundFamilyMultiSelectClass').multiselect('enable');
							$('.fundFamilyMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
							$('.fundFamilyMultiSelectClass').multiselect('updateSelectAll', true);
							$("#meetingDisplayGrid").appendTo("#onlyMeeting_list");
							$("#onlyTableGrid").appendTo("#tilesDiv");
							$("#onlyTableGrid").css("display", "block");
							$("#meetingDisplayGrid").width("100%");
							$("#gbox_list").width("100%");
							$("#gview_list").width("100%");
							//var outerwidth = $('#meetingDisplayGrid').width();
							$('#list').setGridWidth('100%');
							$("#meetingDisplayGrid").css("display", "block");
							$scope.error.noData = false;
							//$scope.showTable.onlyTable = true;

							if ($scope.siteFormat != 'dashboard') // 
							{
								$scope.showTable.onlyTable = false;
							}
							else {
								$scope.showTable.onlyTable = true;
							}

							var outerwidth = $('#meetingDisplayGrid').width();
							$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically
							//$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width()+1);
							$('#meetingDisplayGrid').width($('#meetingDisplayGrid').width() + 2);

							setTimeout(function() {		//re-apply this function, as it was not calling when only meeting list was loaded						

								$(".filterClass").mousemove(function(event) {
									jQuery('#list').setColProp('MeetingType', { sortable: false });
									jQuery('#list').setColProp('Country', { sortable: false });
									jQuery('#list').setColProp('VoteFlag', { sortable: false });
								});

								$(".filterClass").mouseleave(function(event) {
									jQuery('#list').setColProp('MeetingType', { sortable: true });
									jQuery('#list').setColProp('Country', { sortable: true });
									jQuery('#list').setColProp('VoteFlag', { sortable: true });
								});
							}, 50);


						}

						if ($scope.dashboardData == 1 && $scope.meetingTableData == 1) {


							$scope.loadMeetingListUnderGraph = $scope.getCustomOrCommonData($scope.customDashboardProperties.loadMeetingListUnderGraph, $scope.commonDashboardProperties.loadMeetingListUnderGraph);

							if ($scope.loadMeetingListUnderGraph != '' && $scope.loadMeetingListUnderGraph != 'false') // 
							{
								setTimeout(function() {
									$scope.appendGraphTo = $scope.commonDashboardProperties[$scope.loadMeetingListUnderGraph].meetingListDiv;

									//$("#meetingDisplayGrid").appendTo("#MeetingMarket_list");
									/*$("#meetingDisplayGrid").appendTo("#"+$scope.appendGraphTo);
									//$("#meetingDisplayGrid").width("100%");
									$("#gbox_list").width("100%");
									$("#gview_list").width("100%");
									//var outerwidth = $('#meetingDisplayGrid').width();
									$('#list').setGridWidth('100%');
									$("#meetingDisplayGrid").css("display","block");
									$('#meetingDisplayGrid').width('100%');
									$scope.headerDashboardText = $scope.commonDashboardProperties.headerDashboardText;							
									var whichImg = 'meetingMarket_Image';
									var whichImg = $scope.commonDashboardProperties[$scope.loadMeetingListUnderGraph].meetingListButtonImg;
									
									document.getElementById(whichImg).src = '/repo/'+ $scope.CustomerID +'/img/collapse.png';
									var outerwidth = $('#meetingDisplayGrid').width();											
									$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically
									//$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width()+1);
									$('#meetingDisplayGrid').width($('#meetingDisplayGrid').width()+2);*/


									//console.log("call");
									//

									$scope.newExpandButtonFormat = $scope.getCustomOrCommonData($scope.customDashboardProperties.newExpandButtonFormat, $scope.commonDashboardProperties.newExpandButtonFormat);
									if ($scope.newExpandButtonFormat == 'true') {
										var whichImg = $scope.commonDashboardProperties[$scope.loadMeetingListUnderGraph].meetinglistButtonNewFormatId;
									}
									else {
										var whichImg = $scope.commonDashboardProperties[$scope.loadMeetingListUnderGraph].meetingListButtonImg;

									}

									//$scope.previousButtonId = $("#"+$scope.appendGraphTo).prev().attr('id');
									//console.log($scope.appendGraphTo);
									if ($scope.loadMeetingListCount == 1) {
										showHideMeetingList($scope, $scope.appendGraphTo, whichImg, 1);
										$scope.loadMeetingListCount = 2;
									}


								}, 2000);

							}
							$scope.error.noData = false;
							$scope.showTable.onlyTable = false;
						}
						if ($scope.dashboardData == 0 && $scope.meetingTableData == 0) {
							$scope.error.noData = true;
							$scope.showTable.onlyTable = false;
						}
						//$('#spinnerDiv').hide();

						$(".datepickerClass,#toDatepicker,.fundSelectClass,#fundFamilySelect,.companyOrTickerClass,#generatePdf,.selectSignificantMeetings").removeAttr('disabled');
						$('.countryMultiSelectClass').multiselect('enable');
						$('.countryMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
						$('.countryMultiSelectClass').multiselect('updateSelectAll', true);
						$('.fundMultiSelectClass').multiselect('enable');
						$('.fundMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
						$('.fundMultiSelectClass').multiselect('updateSelectAll', true);
						$('.fundFamilyMultiSelectClass').multiselect('enable');
						$('.fundFamilyMultiSelectUL li.disabled').removeClass('disabled').find('input[type="checkbox"]').removeAttr('disabled').prop('disabled', false);
						$('.fundFamilyMultiSelectClass').multiselect('updateSelectAll', true);

						$scope.isLoading = false;
						//$('#spinnerDiv').hide();
						var countryDeselectItems = new Array;
						var countrySelectItems = new Array;

						setTimeout(function() {



							$(':checkbox[value=select-all-country]').change(function() {
								if ($(this).is(":checked")) {
									//$(this).attr("checked", returnVal);
									//console.log($('.countryMultiSelectClass').val());
									$scope.countryMultiSelectTempArr = $('.countryMultiSelectClass').val();
								}
								else {
									if ($(".countryInputSearch").val() != '') {
										//$(".countryMultiSelectClass option:selected").removeAttr("selected");

										//$(".countryMultiSelectClass").multiselect("deselectAll", false);
										//$('ul.countryMultiSelectUL > li:visible > a > label > input').attr('checked', false);															
										//$('.countryMultiSelectClass').val('[""]');
										//$('.countryMultiSelectClass').multiselect('refresh');								
										//$(".countryMultiSelectClass").multiselect("clearSelection");
										//$(".countryMultiSelectClass").multiselect('refresh');
										//$('.countryMultiSelectClass').multiselect('deselect', $scope.countryMultiSelectTempArr);
										$('.countryMultiSelectClass').multiselect('deselect', $scope.countryMultiSelectDefaultArr);

										//$("select.multiselect").multiselect("deselectAll", false);


										setTimeout(function() {
											//$('.countryMultiSelectClass').val('[""]');										
											//$('.countryMultiSelectClass').multiselect('refresh');
											//$(".countryMultiSelectClass").multiselect("clearSelection");
											//$(".countryMultiSelectClass").multiselect('refresh');
										}, 50);

									}
								}

							});

							$(':checkbox[value=select-all-fund]').change(function() {
								if ($(this).is(":checked")) {
									//$(this).attr("checked", returnVal);
									$scope.fundMultiSelectTempArr = $('.fundMultiSelectClass').val();
									$("button.fundMultiSelectButton").attr('title', fundMultiSelectDefaultArr.join(', '));
								}
								else {
									if ($(".fundInputSearch").val() != '') {
										//$(".countryMultiSelectClass option:selected").removeAttr("selected");

										//$(".countryMultiSelectClass").multiselect("deselectAll", false);
										//$('ul.countryMultiSelectUL > li:visible > a > label > input').attr('checked', false);															
										//$('.countryMultiSelectClass').val('[""]');
										//$('.countryMultiSelectClass').multiselect('refresh');								
										//$(".countryMultiSelectClass").multiselect("clearSelection");
										//$(".countryMultiSelectClass").multiselect('refresh');
										$('.fundMultiSelectClass').multiselect('deselect', $scope.fundMultiSelectTempArr);
										//$("select.multiselect").multiselect("deselectAll", false);


										setTimeout(function() {
											//$('.countryMultiSelectClass').val('[""]');										
											//$('.countryMultiSelectClass').multiselect('refresh');
											//$(".countryMultiSelectClass").multiselect("clearSelection");
											//$(".countryMultiSelectClass").multiselect('refresh');
										}, 50);

									}
								}

							});

							$(':checkbox[value=select-all-fundfamily]').change(function() {
								if ($(this).is(":checked")) {
									//$(this).attr("checked", returnVal);
									$scope.fundFamilyMultiSelectTempArr = $('.fundFamilyMultiSelectClass').val();
								}
								else {
									if ($(".fundFamilyInputSearch").val() != '') {
										//$(".countryMultiSelectClass option:selected").removeAttr("selected");

										//$(".countryMultiSelectClass").multiselect("deselectAll", false);
										//$('ul.countryMultiSelectUL > li:visible > a > label > input').attr('checked', false);															
										//$('.countryMultiSelectClass').val('[""]');
										//$('.countryMultiSelectClass').multiselect('refresh');								
										//$(".countryMultiSelectClass").multiselect("clearSelection");
										//$(".countryMultiSelectClass").multiselect('refresh');
										$('.fundFamilyMultiSelectClass').multiselect('deselect', $scope.fundFamilyMultiSelectTempArr);
										//$("select.multiselect").multiselect("deselectAll", false);


										setTimeout(function() {
											//$('.countryMultiSelectClass').val('[""]');										
											//$('.countryMultiSelectClass').multiselect('refresh');
											//$(".countryMultiSelectClass").multiselect("clearSelection");
											//$(".countryMultiSelectClass").multiselect('refresh');
										}, 50);

									}
								}
								loadFundsFromFamily($scope);

							});






						}, 100);

					}

					if ($scope.dashboardData == -1 || $scope.meetingTableData == -1) {
						//$('#spinnerDiv').show();	//				
						$(".datepickerClass").attr('disabled', 'disabled');
						$(".datepickerClass").attr('disabled', 'disabled');
						$(".fundSelectClass").attr('disabled', 'disabled');
						$("#fundFamilySelect").attr('disabled', 'disabled');
						$(".companyOrTickerClass").attr('disabled', 'disabled');
						$('.countryMultiSelectClass').multiselect('disable');
						$('.fundMultiSelectClass').multiselect('disable');
						$('.fundFamilyMultiSelectClass').multiselect('disable');
						$("#generatePdf").attr('disabled', 'disabled');
						$("#significantID").attr('disabled', 'disabled');

						$scope.isLoading = true;
						//$('#spinnerDiv').show();
					}

					if ($scope.isLoading === false) {
						//$('#spinnerDiv').hide(); //
						$('.spinnerDivClass').hide();
						//console.log('hide');
					}
					else {
						//$('#spinnerDiv').show();	//
						$('.spinnerDivClass').show();
						//console.log('show');
					}



				});



				var mouse_is_inside = false;
				var f_mouse_is_inside = false;
				var multiSelectMouse_is_inside = false;

				$(document).ready(function()	//close filter div if clicked outside
				{

					$("button.countryMultiSelectButton").click(function() {
						if ($(this).parent().hasClass('open')) {
							//console.log('before close');
							$('.countryMultiSelectUL').scrollTop(0); // scroll options to the top
							$(this).parent().removeClass('open');
							if ($("input.countryInputSearch").val() != '') {
								$("input.countryInputSearch").val('');
								$('.clear_input').hide();
								$("input.countryInputSearch").trigger("input");
							}
							$scope.countryMultiSelectArr = $scope.countryMultiSelectTempArr;

							//$('.countryMultiSelectClass').multiselect('refresh');					

						}
						else {
							//console.log('before open');
							$("button.fundMultiSelectButton").parent().removeClass('open');	//close other active multiselects
							$("button.fundFamilyMultiSelectButton").parent().removeClass('open');	//close other active multiselects

							if ($("input.countryInputSearch").val() != '') {
								$("input.countryInputSearch").val('');
								$('.clear_input').hide();
								$("input.countryInputSearch").trigger("input");
							}


							$(this).parent().addClass('open');
							$('.countryMultiSelectUL').scrollTop(0); // scroll options to the top
							$(".clearInputStyleCountry").hide();




						}
					});

					/*
					$(':checkbox[value=select-all-country]').change(function() {
						if($(this).is(":checked")) {										
							//$(this).attr("checked", returnVal);
						}
						else
						{										
							if($(".countryInputSearch").val() != '' )
							{
								console.log('yo');
								//$(".countryMultiSelectClass").multiselect("deselectAll", false);
								//$('ul.countryMultiSelectUL > li:visible > a > label > input').attr('checked', false);															
								
								setTimeout(function () {
									$('.countryMultiSelectClass').val('[""]');										
									$('.countryMultiSelectClass').multiselect('refresh');
								}, 50);
							}	
						}
					
					});
					*/



					$("button.fundMultiSelectButton").click(function() {
						if ($(this).parent().hasClass('open')) {
							$('.fundMultiSelectUL').scrollTop(0); // scroll options to the top
							$(this).parent().removeClass('open');

							if ($("input.fundInputSearch").val() != '') {
								$("input.fundInputSearch").val('');
								$('.clear_input').hide();
								$("input.fundInputSearch").trigger("input");
							}

							$scope.fundMultiSelectArr = $scope.fundMultiSelectTempArr;


						}
						else {

							$("button.countryMultiSelectButton").parent().removeClass('open');	//close other active multiselects
							$("button.fundFamilyMultiSelectButton").parent().removeClass('open');	//close other active multiselects
							//console.log('here fundMultiSelectButton');

							if ($("input.fundInputSearch").val() != '') {
								$("input.fundInputSearch").val('');
								$('.clear_input').hide();
								$("input.fundInputSearch").trigger("input");
							}

							$("input.fundInputSearch").addClass('clearable');
							// init plugin (with callback)
							$('.clearable').clearSearch({ callback: function() { } });

							$("input.fundInputSearch").keyup(function(e) {

								if ($.trim($(this).val()) == '') {
									//$(".buttonFund").attr('disabled','disabled');
								}
								else {
									$(".buttonFund").removeAttr('disabled');
									var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
									if (charCode == 13) {
										submitFilter(this, 'fund');
									}
								}

							});

							$("input.fundInputSearch").on('input', function() {

								if ($(this).val() != '') {

									/*
									$("ul.fundMultiSelectUL li").each(function() {										
											if($(this).hasClass("multiselect-item") == false)
											{
												if( $(this).css('display') == 'list-item' && !$(this).find('input:checkbox').attr('checked'))
												{
													$(this).find('input:checkbox').attr('checked',true);				
												}
											}
									});
									*/


									$('ul.fundMultiSelectUL > li:visible > a > label > input').each(function() {
										//selectThese.push($(this).val());											
										$(this).attr('checked', true);
									});
								}
								else {

									var deselectItems = new Array;
									var selectItems = new Array;
									var di = 0;
									var si = 0;


									$(".fundMultiSelectClass option").each(function() {
										if ($(this).is(':selected')) {
											//console.log('selected=>'+$(this).val());
										}
										else {
											deselectItems[di] = $(this).val();
											di++;
											//console.log('not selected=>'+$(this).val());
										}

									});
									$('.fundMultiSelectClass').multiselect('deselect', deselectItems);
									//$('.fundMultiSelectClass').multiselect('select', selectItems);
								}
							});

							$(this).parent().addClass('open');
							$('.fundMultiSelectUL').scrollTop(0); // scroll options to the top
							$(".clearInputStyleFund").hide();


							/* //commented
							var ff_selectedLength = $(".fundFamilyMultiSelectClass :selected").length;	
							var ff_optionLength = $(".fundFamilyMultiSelectClass option").length;
							//console.log('3...'+ff_selectedLength+'=>'+ff_optionLength);
							
							 
							if($scope.showFundFamily == true)
							{
								if(ff_selectedLength == ff_optionLength || ff_selectedLength == 0)
								{
									 loadFundsFromFamily($scope);  
								}
								//loadFundsFromFamily($scope);
							}
							*/



						}
					});



					//
					/*
					$(':checkbox[value=select-all-fund]').change(function() {
								if($(this).is(":checked")) {										
									//$(this).attr("checked", returnVal);
								}
								else
								{										
									if($(".fundInputSearch").val() != '' )
									{
										//$(".fundMultiSelectClass").multiselect("deselectAll", false);
										//$('ul.fundMultiSelectUL > li:visible > a > label > input').attr('checked', false);											
										$(".fundMultiSelectClass").multiselect("clearSelection");
										$(".fundMultiSelectClass").multiselect('refresh');
										
										setTimeout(function () {
											//$('.fundMultiSelectClass').val('[""]');										
											//$('.fundMultiSelectClass').multiselect('refresh');
											$(".fundMultiSelectClass").multiselect("clearSelection");
											$(".fundMultiSelectClass").multiselect('refresh');
										}, 50);
										
									}	
								}
							
							});
					
					
					$("input.fundInputSearch").on('input', function() {
						
						if($(this).val() != '')
						{
							$("ul.fundMultiSelectUL li").each(function() {										
									if($(this).hasClass("multiselect-item") == false)
									{
										if( $(this).css('display') == 'list-item' && !$(this).find('input:checkbox').attr('checked'))
										{
											$(this).find('input:checkbox').attr('checked',true);				
										}
									}
							});
						}
						else
						{
							
							var deselectItems=new Array;
							var selectItems=new Array;
							var di = 0;
							var si = 0;
							
							
							$(".fundMultiSelectClass option").each(function() {									
								if($(this).is(':selected'))
								{										
									//console.log('selected=>'+$(this).val());
								}
								else
								{
									deselectItems[di] = $(this).val();
									di++;
									//console.log('not selected=>'+$(this).val());
								}
								
							});	
							$('.fundMultiSelectClass').multiselect('deselect', deselectItems);	
							//$('.fundMultiSelectClass').multiselect('select', selectItems);
						}
					});
					
					$("input.fundInputSearch").keyup(function(e){
									
						if($.trim($(this).val()) == '')
						{
							//$(".buttonFund").attr('disabled','disabled');
						}
						else
						{
							if($(".fundMultiSelectClass :selected").length == 0)// || ($(".countryMultiSelectClass :selected").length == $(".countryMultiSelectClass option").length))
							{
								
							}
							
							
							
							
							$(".buttonFund").removeAttr('disabled');
							var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
							if(charCode == 13)
							{
								submitFilter(this,'fund');
							}
						}
					});
					*/

					$("button.fundFamilyMultiSelectButton").click(function() {
						if ($(this).parent().hasClass('open')) {
							var ff_selectedLength = $(".fundFamilyMultiSelectClass :selected").length;
							var ff_optionLength = $(".fundFamilyMultiSelectClass option").length;

							/* //commented
							if(ff_selectedLength == ff_optionLength || ff_selectedLength == 0)
							{
								  loadFundsFromFamily($scope);  
							}
							 */


							$(this).parent().removeClass('open');
							$('.fundFamilyMultiSelectUL').scrollTop(0); // scroll options to the top

							if ($("input.fundFamilyInputSearch").val() != '') {
								$("input.fundFamilyInputSearch").val('');
								$('.clear_input').hide();
								$("input.fundFamilyInputSearch").trigger("input");
							}
							$scope.fundFamilyMultiSelectArr = $scope.fundFamilyMultiSelectTempArr;


						}
						else {

							$("button.countryMultiSelectButton").parent().removeClass('open');	//close other active multiselects
							$("button.fundMultiSelectButton").parent().removeClass('open');	//close other active multiselects

							if ($("input.fundFamilyInputSearch").val() != '') {
								$("input.fundFamilyInputSearch").val('');
								$('.clear_input').hide();
								$("input.fundFamilyInputSearch").trigger("input");
							}

							$(this).parent().addClass('open');
							$('.fundFamilyMultiSelectUL').scrollTop(0); // scroll options to the top
							$(".clearInputStyleFundFamily").hide();


						}
					});

					/*
					$(':checkbox[value=select-all-fundfamily]').change(function() {
						if($(this).is(":checked")) {										
							//$(this).attr("checked", returnVal);
						}
						else
						{										
							//$(".fundFamilyMultiSelectClass").multiselect("deselectAll", false);
							
							console.log('ff here');
							if($(".fundFamilyInputSearch").val() != '' )
							{
								//$('ul.fundFamilyMultiSelectUL > li:visible > a > label > input').attr('checked', false);
								
								
								$('.fundFamilyMultiSelectClass').multiselect('deselect', $scope.fundFamilyMultiSelectTempArr);
								
								
								setTimeout(function () {
									//$('.fundFamilyMultiSelectClass').val('[""]');										
									//$('.fundFamilyMultiSelectClass').multiselect('refresh');
									//$(".fundFamilyMultiSelectClass").multiselect("clearSelection");
									//$(".fundFamilyMultiSelectClass").multiselect('refresh');
								}, 50);
								
								
							}
							
						}
						loadFundsFromFamily($scope);
					
					});
					*/




					//setTimeout(function () {							

					$(".filterClass").mousemove(function(event) {
						//console.log('sort false1');		
						jQuery('#list').setColProp('MeetingType', { sortable: false });
						jQuery('#list').setColProp('Country', { sortable: false });
						jQuery('#list').setColProp('VoteFlag', { sortable: false });
					});

					$(".filterClass").mouseleave(function(event) {
						//console.log('sort true1');		
						jQuery('#list').setColProp('MeetingType', { sortable: true });
						jQuery('#list').setColProp('Country', { sortable: true });
						jQuery('#list').setColProp('VoteFlag', { sortable: true });
					});
					//}, 50);


					if (pageInitialized) return;

					pageInitialized = true;

					$("body").mouseup(function() {
						$('#filterDropSearch').hover(function() {
							mouse_is_inside = true;
						}, function() {
							mouse_is_inside = false;
						});

						$('.filterClass').hover(function() {
							f_mouse_is_inside = true;
						}, function() {
							f_mouse_is_inside = false;
						});

						if (!mouse_is_inside && !f_mouse_is_inside) {
							$('#filterDropSearch').hide('500');
						}


						$('button.countryMultiSelectButton, button.fundMultiSelectButton, button.fundFamilyMultiSelectButton, .multiselect-container, .dropdown-menu').hover(function() {
							multiSelectMouse_is_inside = true;
						}, function() {
							multiSelectMouse_is_inside = false;
						});

						if (!multiSelectMouse_is_inside) {
							if ($('button.countryMultiSelectButton').parent().hasClass('open')) {
								$('button.countryMultiSelectButton').parent().removeClass('open');
								//$('ul.countryMultiSelectUL').children('li').removeClass('multiselect-filter-hidden');
								//$('ul.countryMultiSelectUL').children('li').css('display','list-item');
								if ($("input.countryInputSearch").val() != '') {
									$("input.countryInputSearch").val('');
									$('.clearInputStyleCountry').hide();
									$("input.countryInputSearch").trigger("input");
								}
								$scope.countryMultiSelectArr = $scope.countryMultiSelectTempArr;

							}

							if ($('button.fundMultiSelectButton').parent().hasClass('open')) {
								$('button.fundMultiSelectButton').parent().removeClass('open');
								if ($("input.fundInputSearch").val() != '') {
									$("input.fundInputSearch").val('');
									$('.clearInputStyleFund').hide();
									$("input.fundInputSearch").trigger("input");
								}
								$scope.fundMultiSelectArr = $scope.fundMultiSelectTempArr;

							}

							if ($('button.fundFamilyMultiSelectButton').parent().hasClass('open')) {
								$('button.fundFamilyMultiSelectButton').parent().removeClass('open');
								if ($("input.fundFamilyInputSearch").val() != '') {
									$("input.fundFamilyInputSearch").val('');
									$('.clearInputStyleFundFamily').hide();
									$("input.fundFamilyInputSearch").trigger("input");
								}
								$scope.fundFamilyMultiSelectArr = $scope.fundFamilyMultiSelectTempArr;
							}

						}


					});

					$('#checkbox1').change(function() {
						$('#textbox1').val($(this).is(':checked'));
					});









					//to disable sort on mouse of filter in meeting list






				});

				/*	//moved this code in dashboardTile.js
				$( ".filterClass" ).mousemove(function( event ) {		  
				  console.log('hover filter');
				  jQuery('#list').setColProp('MeetingType', {sortable: false});
				  jQuery('#list').setColProp('Country', {sortable: false});
				  jQuery('#list').setColProp('VoteFlag', {sortable: false});
				});
				
				$( ".filterClass" ).mouseleave(function( event ) {		  
				  console.log('out filter');
				  jQuery('#list').setColProp('MeetingType', {sortable: true});
				  jQuery('#list').setColProp('Country', {sortable: true});
				  jQuery('#list').setColProp('VoteFlag', {sortable: true});
				});
		
				*/
				$scope.updateMeetingListURLParameter = function (url, param, paramVal){
					var newAdditionalURL = "";
					var tempArray = url.split("?");
					var baseURL = tempArray[0];
					var additionalURL = tempArray[1];
					var temp = "";
					if (additionalURL) {
						tempArray = additionalURL.split("&");
						for (var i=0; i<tempArray.length; i++){
							if(tempArray[i].split('=')[0] != param){
								newAdditionalURL += temp + tempArray[i];
								temp = "&";
							}
						}
					}
					var rows_txt = temp + "" + param + "=" + paramVal;
					vdsDownloadMeetingListURL = baseURL + "?" + newAdditionalURL + rows_txt;
				}
				$scope.updateMeetingDetailURLParameter = function (url, param, paramVal){
					var newAdditionalURL = "";
					var tempArray = url.split("?");
					var baseURL = tempArray[0];
					var additionalURL = tempArray[1];
					var temp = "";
					if (additionalURL) {
						tempArray = additionalURL.split("&");
						for (var i=0; i<tempArray.length; i++){
							if(tempArray[i].split('=')[0] != param){
								newAdditionalURL += temp + tempArray[i];
								temp = "&";
							}
						}
					}
					var rows_txt = temp + "" + param + "=" + paramVal;
					vdsDownloadMeetingDetailURL = baseURL + "?" + newAdditionalURL + rows_txt;
				}
			}

		};
	});


vdsApp.compileProvider.
	directive('vdsFooter', function(vdsServices) {



		return {
			restrict: 'E',
			transclude: true,
			scope: {
				data: '=data'
			},
			controller: ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {

				$scope.footerPath = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/app/img/iss-logo.png?version=' + vdsServices.getCSSJSVersion();
				//$scope.issFooterLink = 'http://www.issgovernance.com/governance-solutions/proxy-voting-services/vote-disclosure-services/';
				$scope.issFooterLink = vdsServices.getVDSComponentsJSON().ISSPolicyLink;
				$scope.commonDashboardProperties = vdsServices.getDashboardProperties();
				$scope.customDashboardProperties = vdsServices.getCustomProperties();
        $scope.copyright = new Date();

				$scope.getCustomOrCommonData = function(custom, common) {
					var CustomOrCommonData = '';
					if (custom != '' && custom != undefined) {
						CustomOrCommonData = custom;
					}
					else {
						CustomOrCommonData = common;
					}
					return CustomOrCommonData;
				};

				if ($scope.customDashboardProperties.showISSLogo == undefined) {
					$scope.customDashboardProperties.showISSLogo = 'false';
				}

				$scope.showISSLogo = $scope.getCustomOrCommonData($scope.customDashboardProperties.showISSLogo, $scope.commonDashboardProperties.showISSLogo);
				if ($scope.showISSLogo == 'true') {
					$scope.showISSLogo = true;
				}
				else {
					$scope.showISSLogo = false;
				}

				if ($scope.customDashboardProperties.footerGraphicalDashboardTextShow == undefined) {
					$scope.customDashboardProperties.footerGraphicalDashboardTextShow = 'false';
				}
				$scope.footerGraphicalDashboardTextShow = $scope.getCustomOrCommonData($scope.customDashboardProperties.footerGraphicalDashboardTextShow, $scope.commonDashboardProperties.footerGraphicalDashboardTextShow);


				if ($scope.customDashboardProperties.footerGraphicalDashboardText == undefined) {
					$scope.customDashboardProperties.footerGraphicalDashboardText = '';
				}
				$scope.siteFormat = $scope.getCustomOrCommonData($scope.customDashboardProperties.liveSiteFormat, $scope.commonDashboardProperties.liveSiteFormat);
				$scope.debugMode = '';



				if ($routeParams.debug != undefined && $routeParams.debug != '') {
					$scope.debugMode = $routeParams.debug;
				}



				if ($scope.debugMode != '') {
					var tmpParams = $scope.debugMode.split("|");

					for (var j = 0; j < tmpParams.length; j++) {
						subParams = tmpParams[j].split('=');

						if (subParams[0] == 'SiteMode' && subParams[1] == 'MeetingDrilldown' && $scope.CustomerID == '3541') {
							$scope.siteFormat = subParams[1];
						}


					}
				}
				if ($scope.siteFormat != 'dashboard') {
					//	console.log($scope.footerGraphicalDashboardTextShow);
					$scope.footerGraphicalDashboardTextShow = 'false';
					//	console.log($scope.footerGraphicalDashboardTextShow);

				}
				//$scope.footerGraphicalDashboardText = $scope.getCustomOrCommonData($scope.customDashboardProperties.footerGraphicalDashboardText,$scope.commonDashboardProperties.footerGraphicalDashboardText);		
				if ($scope.customDashboardProperties.footerGraphicalDashboardText != '' && $scope.customDashboardProperties.footerGraphicalDashboardText != undefined && vdsServices.getlanguageUse() == 'en') {
					$scope.footerGraphicalDashboardText = $scope.customDashboardProperties.footerGraphicalDashboardText;
				} else {
					$scope.footerGraphicalDashboardText = vdsServices.getPreferLanguageProperties().footerGraphicalDashboardText;
				}

			}],

			//templateUrl: vdsServices.getBaseURL() + vdsServices.getRepoDirectory()+ '/'+ vdsServices.getCustomerId() +'/directives/templates/footer.html?version='+vdsServices.getCSSJSVersion(),
			templateUrl: function() {
				var templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/app/js/vds_components/templates/footer.html?version=' + vdsServices.getCSSJSVersion();
				var customTemplateFile = vdsServices.getCustomProperties().footerTemplate;
				if (customTemplateFile != '' && customTemplateFile != undefined) {
					if (customTemplateFile != 'global') {
						templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/templates/footer.html?version=' + vdsServices.getCSSJSVersion();
					}
				}

				var commonTemplateFile = vdsServices.getDashboardProperties().footerTemplate;
				if (commonTemplateFile != '' && commonTemplateFile != undefined) {
					if (commonTemplateFile != 'global') {
						templateUrl = vdsServices.getBaseURL() + vdsServices.getRepoDirectory() + '/' + vdsServices.getCustomerId() + '/directives/templates/footer.html?version=' + vdsServices.getCSSJSVersion();
					}
				}

				return templateUrl;
			},
			link: function($scope, $element, $attrs, controller) {



			}

		};
	});


function pad(n) {
	return (n < 10) ? ("0" + n) : n;
}

function fixedDialogBox(evt, selectID, event, passcustomerID) {
	var languageProperties = {};

	getLanguageJSON(function(response) {
		// Parse JSON string into object
		var x = JSON.stringify(response);

		languageProperties = JSON.parse(response);



		var ids = jQuery("#list").jqGrid('getDataIDs');
		var rowData = jQuery('#list').jqGrid('getRowData', ids[0]);


		var filterData = new Array();
		var existingFilterData = new Array();
		var filterName = '';
		var leftPos = '';
		var topos = '';
		parentDiv = $('#meetingDisplayGrid').parent().attr("id");


		if (parentDiv == 'MeetingType_list') {
			topos = '486px';
		}
		else if (parentDiv == 'MeetingMarket_list') {
			topos = '1227px';
		}
		else if (parentDiv == 'MeetingManagement_list') {
			//topos = '1553px';
			topos = '286px';
		}
		else if (parentDiv == 'MeetingSector_list') {
			topos = '2125px';
		}
		else if (parentDiv == 'MeetingStatistics_list') {
			topos = '2743px';
		}
		else if (parentDiv == 'MeetingProposal_list') {
			topos = '3481px';
		}

		var filterData = new Array();
		if (selectID == 'Meeting_Type') {
			filterData = $.trim(rowData.MeetingTypeList).split(' || ');
			filterName = 'MeetingTypeList';
			leftPos = '612px';
			filterData.sort();


			var meetingTypeStr = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');

			if (meetingTypeStr != '') {
				existingFilterData = meetingTypeStr.split('||');
			}

			$('#filterDropSearch').css('width', '155px');
		}
		else if (selectID == 'Country') {
			rowData.CountryList = $.trim(rowData.CountryList).replace(/[\n\r]+/g, ' ');
			filterData = $.trim(rowData.CountryList).split(' || ');
			filterName = 'CountryList';
			leftPos = '712px';
			filterData.sort();
			/*************************************************************/
			var arrVar = filterData;
			var finalArray = new Array();
			var newArr = {};
			for (k in arrVar) {
				newArr[k] = arrVar[k].toLowerCase();
			}

			var arr = [];
			for (var key in newArr) {
				if (newArr.hasOwnProperty(key)) {
					arr.push([newArr[key], key]);
				}
			}
			arr.sort();
			for (k in arr) {
				data = arr[k];
				if (finalArray.indexOf($.trim(arrVar[data[1]])) == -1) {
					finalArray.push($.trim(arrVar[data[1]]));
				}

			}
			filterData = finalArray;
			/*************************************************************/
			var countryListStr = jQuery("#list").jqGrid('getGridParam', 'CountryList');
			if (countryListStr != '') {
				existingFilterData = countryListStr.split('||');
			}
			$('#filterDropSearch').css('width', '170px');
		}
		else if (selectID == 'VoteFlag') {
			filterData = $.trim(rowData.VotedList).split(' || ');
			filterName = 'VotedList';
			leftPos = '822px';
			$('#filterDropSearch').css('width', '130px');
			filterData.sort();
			var votedListStr = jQuery("#list").jqGrid('getGridParam', 'VotedList');
			if (votedListStr != '') {
				existingFilterData = votedListStr.split('||');
			}

		}

		/*
		var myElement = document.querySelector("#jqgh_MeetingType");     
		var position = getPosition(myElement);
		console.log("The element is located at: " + position.x + ", " + position.y);
		
		var leftPos = position.x+133;
		var topos = position.y;
		
		var logo = document.getElementById('jqgh_MeetingType');
		var logoTextRectangle = logo.getBoundingClientRect();
		console.log("logo's left pos.:", logoTextRectangle.left);
		console.log("logo's right pos.:", logoTextRectangle.right);
		
		var leftPos = logoTextRectangle.left;
		var topos = logoTextRectangle.right;
		*/

		var a = $('#filterDropSearch');
		//var topos = '1123px';
		var lpos = '655px';
		var offset = $(evt).offset();
		//console.log(offset.left+'=>'+offset.top);

		leftPos = event.clientX;
		topos = event.clientY;

		$(a).css({
			//'left' : (offset.left / 2)+75
			//'left' : offset.left
			//'left' : lpos
			left: leftPos

		});
		$(a).css({
			//'top' : offset.top -200 
			//'top' : offset.top
			//'top' : 1257
			'top': topos
		});


		var findSelect = ($("#filterDropSearch input").attr('id'));
		//console.log(findSelect+"=>"+selectID+"=>"+$('#filterDropSearch').css('display'));
		if (findSelect == selectID && $('#filterDropSearch').css('display') == 'block')	//if filter dropdown is open, close it if clicked again
		{
			$('#filterDropSearch').hide('500');
		}
		else {
			$('#filterDropSearch').hide();	//hide any active filter div
			if (selectID == 'VoteFlag') {
				var selectStr = '<b>' + 'Status' + '</b>';
			}
			else {
				var selectStr = '<b>' + selectID + '</b>';
			}

			var str = '';
			var z = 10;
			var i = 1;

			str += '<input type="hidden" id="' + selectID + '" />';
			str += '<label style="display:none;" id="' + filterName + '" />';
			var checkedStr = '';
			//var checkedFirstStr = 'checked';
			str += '<input type="checkbox" class="messageCheckbox filtertext checkDetect" id="check_all" name="check_all" value="" onClick="toggleCheck(this)" style="margin-top: -2px;" ><label for="check_all" style="display:inline; padding-left:5px; " class="filterlabel ">' + languageProperties.selectAll + '</label><br / ><hr style="border-bottom: 1px solid #d3d3d3 !important; width: 115px" class="">';
			var blanksFlag = 0;
			for (a in filterData) {

				if ($.trim(filterData[a]) != 'Unknown' && $.trim(filterData[a]) != '(Blanks)') {
					if (jQuery.inArray($.trim(filterData[a]), existingFilterData) !== -1 || existingFilterData.length == 0) {
						checkedStr = 'checked';
					}
					//var selectStr = "onclick="doSelectAll("'+ selectID +'")";
					if (languageProperties[$.trim(filterData[a])] !== undefined) {
						var label = languageProperties[$.trim(filterData[a])];
					} else { label = $.trim(filterData[a]); }
					str += '<input type="checkbox" class="messageCheckbox filtertext " id="' + i + '_id" name="' + selectID + '" value="' + $.trim(filterData[a]) + '" style="margin-top: -2px;" ' + checkedStr + ' onchange ="doSelectAll(' + "'" + selectID + "'" + ');"><label for="' + i + '_id" style="display:inline; padding-left:5px; " class="filterlabel ">' + label + '</label><br>';
					checkedStr = '';
					i++;
				}
				else {
					blanksFlag = 1;
				}

			}

			if (blanksFlag == 1) {
				var blanksStr = '(Blanks)';
				i++;
				if (jQuery.inArray(blanksStr, existingFilterData) !== -1 || existingFilterData.length == 0) {
					checkedStr = 'checked';
				}
				str += '<input type="checkbox" class="messageCheckbox filtertext " id="' + i + '_id" name="' + selectID + '" value="' + blanksStr + '" style="margin-top: -2px;" ' + checkedStr + ' onchange ="doSelectAll(' + "'" + selectID + "'" + ');"><label for="' + i + '_id" style="display:inline; padding-left:5px; " class="filterlabel " >' + blanksStr + '</label><br>';
				checkedStr = '';

			}
			//alert('here2');
			var bstr = '';
			var cstr = '';

			cstr += '<input type="button" id="button" value="' + languageProperties.Apply + '" class="filterbutton " onClick="closefixedDialogBox();" style="margin-left: 42px; margin-top: 10px; margin-bottom: 10px; border: 2px solid #99bfdf; background: #EEEEEE; font-weight: bold; color: #1A6499;"/>';
			//bstr += '<input type="button" id="button" value="Apply" class="filterbutton " onClick="closefixedDialogBox();" style="margin-left: 35px; margin-top: 10px; margin-bottom: 10px; border: 2px solid #99bfdf !important; background: #EEEEEE; font-weight: bold; color: #1A6499; position: absolute;"/>';
			var divstr = "<div style='overflow: auto; height: auto; max-height: 250px;'>" + str + "</div>" + cstr;
			//$('#filterDropSearch').html(str);
			$('#filterDropSearch').html(divstr);
			doSelectAll(selectID);
			//$("#filterDropSearch").appendTo("#jqgh_MeetingType");
			$('#filterDropSearch').show('500');
			//$('#filterDropSearchOuter').append(bstr);
			//$('#filterDropSearchOuter').show();


		}

	}, passcustomerID);
}

function toggleCheck(source) {
	var checkboxes = document.getElementsByClassName('messageCheckbox');
	$('#filterDropSearch div').css('overflow', 'hidden');
	for (var i = 0, n = checkboxes.length; i < n; i++) {
		checkboxes[i].checked = source.checked;
	}
	$('#filterDropSearch div').css('overflow', 'auto');
}

function getPosition(element) {
	var xPosition = 0;
	var yPosition = 0;

	while (element) {
		xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
		yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
		element = element.offsetParent;
	}
	return { x: xPosition, y: yPosition };
}

function showGridTooltipTmp(tooltipText, event) {
	$('#gridTooltip').html(tooltipText);
	$('#gridTooltip').show();
	$('#gridTooltip').removeClass("hidden");

	//$(ele+' span' ).attr("class",'gridTooltipHoverClass');
	//ele.getElementsByTagName('span')[0].className = 'gridTooltipHoverClass';

	var a = $('#gridTooltip');

	$(a).css({

		left: event.pageX
		//left: myMouseX

	});
	$(a).css({

		top: event.pageY
		//top: myMouseY
	});

	//console.log('here');
	// console.log('client=>'+event.clientX+"=>"+event.clientY);
	//console.log('page=>'+event.pageX+"=>"+event.pageY);
}

function hideGridTooltipTmp() {
	$('#gridTooltip').hide();

}

function showGridTooltip(ele, tooltipText, event) {
	//$('#gridTooltip').html(tooltipText);	 

	//$(ele+' span' ).attr("class",'gridTooltipHoverClass');
	$('#meetingListGrid').css('overflow','visible');
	if (ele.getElementsByTagName('span')[0].className == 'gridTooltipClass dummyPosition') {
		var topPos = $(window).scrollTop() - ele.offsetTop + 100;
		ele.getElementsByTagName('span')[0].style.top = ele.offsetTop;
		ele.getElementsByTagName('span')[0].style.height = '35px';
		//console.log(topPos + '=>' + ele.offsetTop + '=>' +  $(window).scrollTop());
		//console.log(event.pageX+'=>'+event.pageY);
		ele.getElementsByTagName('span')[0].className = 'gridTooltipHoverClass dummyPosition';
	}
	else {
		ele.getElementsByTagName('span')[0].className = 'gridTooltipHoverClass';
	}



	/*
	
	*/


}

function hideGridTooltip(ele) {
	$('#meetingListGrid').css('overflow','hidden');
	if (ele.getElementsByTagName('span')[0].className == 'gridTooltipHoverClass dummyPosition') {
		ele.getElementsByTagName('span')[0].className = 'gridTooltipClass dummyPosition';
		ele.getElementsByTagName('span')[0].style.top = 'auto';
		ele.getElementsByTagName('span')[0].style.left = 'auto';
		ele.getElementsByTagName('span')[0].style.height = 'auto';
	}
	else {
		ele.getElementsByTagName('span')[0].className = 'gridTooltipClass';
	}

}


function resetMeetingListFilter() {

	jQuery('#list').jqGrid('setGridParam', { page: 1, postData: { MeetingTypeList: '', CountryList: '', VotedList: '' }, MeetingTypeList: '', CountryList: '', VotedList: '' });
	jQuery("#list").trigger("reloadGrid");
	$('#filterDropSearch').hide();
	$("#gbox_list").show();
	$("#resetMeetingListfilter").hide();
}

function doSelectAll(selectID) {

	var checkboxes = document.getElementsByName(selectID);
	var checkCount = 0;
	var totalCount = 0;

	for (var i = 0, n = checkboxes.length; i < n; i++) {

		if (checkboxes[i].type === 'checkbox') {
			totalCount++;
			if (checkboxes[i].checked === true)
				checkCount++;
		}
	}
	//console.log(checkCount+"=>"+totalCount);
	$('#filterDropSearch div').css('overflow', 'hidden'); // added for IE9 Fix
	if (checkCount == totalCount) {
		document.getElementById('check_all').checked = true;
	}
	else {
		document.getElementById('check_all').checked = false;
	}
	$('#filterDropSearch div').css('overflow', 'auto');// added for IE9 Fix

}

function closefixedDialogBox() {

	var findSelect = ($("#filterDropSearch input").attr('id'));
	var filter = ($("#filterDropSearch label").attr('id'));
	var selectedOptions = '';


	$('.messageCheckbox:checked').each(function() {
		if (selectedOptions == '') {
			selectedOptions += this.value;
		}
		else {
			selectedOptions += '||' + this.value;
		}


	});
	//console.log(selectedOptions);

	if (selectedOptions != '') {
		//selectedOptions = selectedOptions.replace(/,\s*$/, "");
	}
	//console.log(selectedOptions);

	var selArr = selectedOptions.split('||');
	var selLen = selArr.length;	//count total no of "selected" checkboxes in filter div
	var totalCheckboxes = $('.messageCheckbox').size(); //count no of checkboxes in filter div


	if (selLen == totalCheckboxes - 1)	//if all checkboxes are selected, this means reset filter to be activated
	{
		selectedOptions = '';	//empty the options to force "reset filter"
	}
	/*
	var myUrl = jQuery("#list").jqGrid('getGridParam', 'url');		
	myUrl += '&'+filter+'='+selectedOptions;
	*/

	var meetingTypeStr = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');
	var countryListStr = jQuery("#list").jqGrid('getGridParam', 'CountryList');
	var votedListStr = jQuery("#list").jqGrid('getGridParam', 'VotedList');


	var tempActionCode = 110;
	if (filter == 'MeetingTypeList') {
		meetingTypeStr = selectedOptions;
		tempActionCode = 107;
	}
	else if (filter == 'CountryList') {
		countryListStr = selectedOptions;
		tempActionCode = 108;
	}
	else if (filter == 'VotedList') {
		votedListStr = selectedOptions;
		tempActionCode = 109;
	}

	//alert('&'+filter+'='+selectedOptions);
	//console.log('myUrl=>'+myUrl);
	$('#filterDropSearch').hide('500');	//close filter box
	//jQuery("#list").jqGrid().setGridParam({page : 1,url:myUrl });	

	jQuery('#list').jqGrid('setGridParam', { page: 1, postData: { MeetingTypeList: meetingTypeStr, CountryList: countryListStr, VotedList: votedListStr, actionCode: tempActionCode,sessionToken:loggerHelperConfig.sessionToken }, MeetingTypeList: meetingTypeStr, CountryList: countryListStr, VotedList: votedListStr });
	var mtype = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');

	jQuery("#list").trigger("reloadGrid");
	$('#filterDropSearch').hide('500');	//close filter box


}

function closeFixedDialogBoxCustom() {

	var findSelect = ($("#filterDropSearch input").attr('id'));
	var filter = 'CountryList';
	var selectedOptions = '';


	$('.messageCheckbox:checked').each(function() {
		if (selectedOptions == '') {
			selectedOptions += this.value;
		}
		else {
			selectedOptions += '||' + this.value;
		}


	});
	//console.log(selectedOptions);

	if (selectedOptions != '') {
		//selectedOptions = selectedOptions.replace(/,\s*$/, "");
	}
	//console.log(selectedOptions);

	var selArr = selectedOptions.split('||');
	var selLen = selArr.length;	//count total no of "selected" checkboxes in filter div
	var totalCheckboxes = $('.messageCheckbox').size(); //count no of checkboxes in filter div


	if (selLen == totalCheckboxes - 1)	//if all checkboxes are selected, this means reset filter to be activated
	{
		selectedOptions = '';	//empty the options to force "reset filter"
	}
	/*
	var myUrl = jQuery("#list").jqGrid('getGridParam', 'url');		
	myUrl += '&'+filter+'='+selectedOptions;
	*/

	var meetingTypeStr = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');
	var countryListStr = jQuery("#list").jqGrid('getGridParam', 'CountryList');
	var votedListStr = jQuery("#list").jqGrid('getGridParam', 'VotedList');



	if (filter == 'MeetingTypeList') {
		meetingTypeStr = selectedOptions;
	}
	else if (filter == 'CountryList') {
		countryListStr = selectedOptions;
	}
	else if (filter == 'VotedList') {
		votedListStr = selectedOptions;
	}

	//alert('&'+filter+'='+selectedOptions);
	//console.log('myUrl=>'+myUrl);
	$('#filterDropSearch').hide('500');	//close filter box
	//jQuery("#list").jqGrid().setGridParam({page : 1,url:myUrl });	

	jQuery('#list').jqGrid('setGridParam', { page: 1, postData: { MeetingTypeList: meetingTypeStr, CountryList: countryListStr, VotedList: votedListStr }, MeetingTypeList: meetingTypeStr, CountryList: countryListStr, VotedList: votedListStr });
}

function callGrid() {

	var s = document.getElementById("PageDropdown");
	var strPageDropdown = s.options[s.selectedIndex].text;
	//alert( 'page=>'+strPageDropdown);

	//$scope.setMeetingPage = strPageDropdown;
	//$scope.getMeetingList();

	//var $table = $("#list");
	//$table.trigger('reloadGrid');

	jQuery("#list").jqGrid().setGridParam({ page: strPageDropdown });
	jQuery("#list").trigger("reloadGrid");
	$('#filterDropSearch').hide();	//close filter box

}

//VDS-1391 - Call the cached values of meeting detail from new function on onchange of security list dropdown[START]
var showMeetingDetailFunctionCache = null;
var selectedSecurityId = ''; 

function showMeetingDetailFromCache() {
	//destructuring
	const {el, meetingID, signMeeting,fundInfo, MultipleBallotIDs, VoteList, MeetingType, Proponent, CommonCustomLanguage, propsalCategoryList} = showMeetingDetailFunctionCache;
	
	//retrieves the current value of the dropdown element and set it to the variable
	selectedSecurityId = $("#cusipisindropdown").val();
	
	showMeetingDetail(el, meetingID, signMeeting,fundInfo, MultipleBallotIDs, VoteList, MeetingType, Proponent, CommonCustomLanguage, propsalCategoryList);
}
//VDS-1391 - Call the cached values of meeting detail from new function on onchange of security list dropdown[END]

function showMeetingDetail(el, meetingID, signMeeting,fundInfo, MultipleBallotIDs, VoteList, MeetingType, Proponent, CommonCustomLanguage, propsalCategoryList) {

	var passLanguage = {};
	// signMeeting = signMeeting;
	signMeeting = "No";
	if(vdsAppHelper.meetingsStore[meetingID]["IsWFTSignMeeting"] === "Yes" && ([2,4].indexOf(vdsAppHelper.significantMeetingTypeID)>-1)) {
		signMeeting = "Yes";
	}

	VoteList = VoteList.replace(/\\'/g, "'");
	MeetingType = MeetingType.replace(/\\'/g, "'");
	Proponent = Proponent.replace(/\\'/g, "'");

	propsalCategoryList = propsalCategoryList.replace(/\\\\/g,"\\");
	propsalCategoryList = propsalCategoryList.replace(/\\'/g, "'");
	//VDS-1391 - Cache the input parameter values [START]
	showMeetingDetailFunctionCache = {el, meetingID, signMeeting,fundInfo, MultipleBallotIDs, VoteList, MeetingType, Proponent, CommonCustomLanguage, propsalCategoryList};
    //VDS-1391 - Cache the input parameter values [END]

	passLanguage = JSON.parse(VoteList);
	var meetingTypeList = JSON.parse(MeetingType);
	var proponentList = JSON.parse(Proponent);
	var propsalCategoryLabel = JSON.parse(propsalCategoryList);

	//VDS-1391 - call the function to create security list dropdown [START]
	vdsAppHelper.createSecurityListDropdown(meetingID);
	//VDS-1391 - call the function to create security list dropdown [END]

	var meetingDetailFooterInfo = "Zu den Fonds, die dieses Treffen abgehalten haben, gehören:&nbsp;&nbsp;";
	//var $scope = angular.element(el).scope();				
	//console.log($scope.commonDashboardProperties.colNamesMeetingDetail);
	//$("#meetingDisplayGrid").appendTo("#MeetingType_list");
	$("#meetingDisplayGrid").hide();
	var outerwidth = $('#meetingDisplayGrid').width();
	//console.log("Meeting List OuterWidth" + outerwidth);
	$('#meetingListGrid').width(outerwidth);
	$('#meetingListGrid').width('100%');
	//console.log('Meetinglist Width'+$('#meetingListGrid').width());	
	fundInfo = fundInfo.replace(/\|\|/g, '%7C%7C'); // replace all '||' with %7C%7C	

	//clear data of meeting detail before loading
	$("#listDetail").jqGrid('GridUnload');
	$('#companyName').html('');
	$('#significantDetailView').html('');
	$('#significantDetailView').hide();
	$('#ticker').html('');
	$('#meetingDate').html('');
	$('#recordDate').html('');
	$('#securityID').html('');
	$('#meetingType').html('');
	$('#industrySector').html('');
	$('#country').html('');
	$('#cusip').html('');
	$('#isin').html('');
	$('#sharesOnLoan').html('');
	$('#fundNames').html('');
	$("#futureMeetingText").hide();

	$("#filterDropSearch").hide();
	vdsAppHelper.showOrHideCompleteAgendaLink(el, meetingID, signMeeting,fundInfo, MultipleBallotIDs, VoteList, MeetingType, Proponent, CommonCustomLanguage, propsalCategoryList);


	var srchStr = '';
	if (fundInfo != '') {
		srchStr += '&fundValue=' + fundInfo;
	}

	
	var URLparser = document.createElement('a');
	URLparser.href = window.location;

	var baseURI = URLparser.baseURI;
		
	
	if(baseURI == undefined){
			baseURI = URLparser.href;
	}

	if (baseURI.includes("-staging")) {
		isLiveSite = 0;
	}
	else{
		isLiveSite = 1;
	}

	srchStr += '&liveSiteYN=' + isLiveSite + "&signMeeting="+vdsAppHelper.getSignificantVoteFilterQueryParam() + "&signVote="+vdsAppHelper.getSignificantVoteFilterQueryParam();	
	
	//console.log('meeting list'+$("#list"));
	$('#listDetail').jqGrid('GridUnload');
	grid = $("#listDetail"),

		getUniqueNames = function(columnName) {
			var texts = grid.jqGrid('getCol', columnName), uniqueTexts = [],
				textsLength = texts.length, text, textsMap = {}, i;
			for (i = 0; i < textsLength; i++) {
				text = texts[i];
				if (text !== undefined && textsMap[text] === undefined) {
					// to test whether the texts is unique we place it in the map.
					textsMap[text] = true;
					uniqueTexts.push(text);
				}
			}
			return uniqueTexts;
		},
		buildSearchSelect = function(uniqueNames) {
			var values = ":All";
			$.each(uniqueNames, function() {
				values += ";" + this + ":" + this;
			});
			return values;
		},
		setSearchSelect = function(columnName) {
			/*console.log(columnName);
			console.log(getUniqueNames(columnName));
			console.log(buildSearchSelect(getUniqueNames(columnName)));*/
			grid.jqGrid('setColProp', columnName,
				{
					stype: 'select',
					searchoptions: {
						value: buildSearchSelect(getUniqueNames(columnName)),
						sopt: ['eq']
					}
				}
			);
		};
		//VDS-1391 - check for meeting detail header preferences [START]
		vdsAppHelper.processMeetingDetailHeaderPreferences(colModelMeetingDetail);
		//VDS-1391 - check for meeting detail header preferences [END]
		vdsAppHelper.processMeetingDetailColumnPreferences(colModelMeetingDetail);

		var meetingDetailUrl = '/vds/api/getVdsData/7?customerID=' + $('#list').jqGrid('getGridParam', 'EncodedCustomerID') + '&fromDate=' + '' + '&toDate=' + '' + srchStr + '&meetingID=' + meetingID + '&random=' + Math.random() + '&locale=' + getLanguageFromUrl();
    
    //VDS-1391 - Send Cusip, Isin as input to meeting detail view proc conditionally [START]    
        if(!selectedSecurityId) {
			selectedSecurityId = "";
		}
		
        var selectedSecurityArray = selectedSecurityId.split(",");
        if(selectedSecurityArray != "All")
		{
            if(vdsAppHelper.meetingDetailHeadersColumns.includes('cusip')){
				$("#cusip").text(selectedSecurityArray[0]);
				meetingDetailUrl += "&cusip="+selectedSecurityArray[0];
			}
			if(vdsAppHelper.meetingDetailHeadersColumns.includes('isin')){
				$("#isin").text(selectedSecurityArray[selectedSecurityArray.length-1]);
				meetingDetailUrl += "&isin="+selectedSecurityArray[selectedSecurityArray.length-1];
			}
		}
		else{
            var meeting = vdsAppHelper.meetingsStore[meetingID];
            var formattedCusips = meeting.Cusips.replace(/,/g, ',&ensp;');
            var formattedIsins = meeting.Isins.replace(/,/g, ',&ensp;');
            $("#cusip").html(formattedCusips);
            $("#isin").html(formattedIsins);
		}
		//VDS-1391 - Send Cusip, Isin as input to meeting detail view proc conditionally [END]
	

	grid.jqGrid({
		//data: mydata,
		//datatype: 'local',
		//url:vdsServices.getBaseURL() + 'vdsapi/getVdsData/5?customerID='+ $routeParams.id +'&fromDate='+$scope.parent.fromDate+'&toDate='+$scope.parent.toDate+srchStr,
		//url:vdsServices.getBaseURL() + 'vdsapi/getVdsData/5?customerID='+ $routeParams.id +'&fromDate='+$scope.searchCriteria.fromDate+'&toDate='+$scope.searchCriteria.toDate+srchStr,
		//url:'/vdsapi/getVdsData/7?customerID='+ 'MzU0MQ==' +'&fromDate='+''+'&toDate='+''+srchStr+'&meetingID='+meetingID+'&random='+Math.random(),
		//url:'/vdsapi/getVdsData/7?customerID='+ 'MzU0MQ==' +'&fromDate='+''+'&toDate='+''+srchStr+'&meetingID='+meetingID+'&random='+Math.random(),
		url: meetingDetailUrl,

		datatype: "json",
		pgbuttons: false,
		viewrecords: false,
		pgtext: "",
		pginput: false,
		loadError: function(xhr, status, error) {
			vdsAppHelper.handleRedirectionForXhr(xhr);			
		},
		postData:
		{
			actionCode: 114,
			sessionToken: loggerHelperConfig.sessionToken
		},
		jsonReader: {
			repeatitems: false,
			root: function(data) {
				//the actual data
				var result = data;
				
				var count = result.data;
				if (CommonCustomLanguage === 'custom') {
					for (x = 0; x < count.length; x++) {  //Changed var name from i to x , as it is used in internal function call and overriding the value.
						//result.data[x].ClientVoteList = passLanguage[result.data[i].ClientVoteList];
						result.data[x].MgtRecVote = passLanguage[result.data[x].MgtRecVote];

						/****************PROPONENT ***************/
            
						var resStr = '';
						if (result.data[x].ShareholderProposal === '' || result.data[x].ShareholderProposal === -1) {
							resStr = '';
						}
						else if (result.data[x].ShareholderProposal === 0) {
							resStr = 'Management';
						}
						else if (result.data[x].ShareholderProposal === 1) {
							resStr = 'Shareholder';
						}

						result.data[x].ShareholderProposal = proponentList[resStr];


						/*************************************************/


						/*******************CLIENT VOTE LIST******************************/
						var str = "" + result.data[x].ClientVoteList + "";
						var final
						if (str.indexOf(" , ,") === 0) {
							final = '';
							result.data[x].ClientVoteList = final
						}
						else {
							var strArr = str.split(',');
							// Clean Client list array with empty content
							strArr = strArr.filter(item => item !== "");
							//console.log(strArr);
							//str = (strArr.length ? "'" + strArr.join("','") + "'" : "")				
							var resultArr = [];
							var futureVotesString = false;
							$.each(strArr, function(k, v) {
								if ($.inArray(v.trim(), resultArr) == -1) resultArr.push(v.trim());

								if (v == ' *' || v == '*')	//check for future votes string, show 'futureMeetingText' if future vote string found
								{
									futureVotesString = true;
									$("#futureMeetingText").show();
								}
							});
							//console.log(resultArr);

							var finalResult = [];
							var dnvFound = 0;
							$.each(resultArr, function(d, v) {
								if (v == ' Did Not Vote') {
									dnvFound = 1;
								}
								else {
										finalResult.push(v);
								}

							});

							if (dnvFound == 1) {
								if(finalResult.length == 0)
									finalResult.push('Did Not Vote');
								else
									finalResult.push(' Did Not Vote');
							}


							for (j = 0; j < finalResult.length; j++) {
               //added check for &nbsp before finding property for language translation. 
								finalResult[j] = (j==0 ? " ": "&ensp;") + (passLanguage[finalResult[j].trim().replace(/&nbsp/g, '').replace(/&ensp;/g, '')] === undefined ? finalResult[j].trim().replace(/&nbsp/g, '').replace(/&ensp;/g, '') : passLanguage[finalResult[j].trim().replace(/&nbsp/g, '').replace(/&ensp;/g, '')]);
							}
							var resStr = finalResult.toString();

							result.data[x].ClientVoteList = resStr



							/*************************************************/
							/****************** PARSE Proposal***************************** */

							var displayNotesTypeInfo = jQuery("#list").jqGrid('getGridParam', 'DisplayNotesTypeInfo');
							var proposalInfo = computeProposalNotes(displayNotesTypeInfo, result.data[x].Proposal, result.data[x].ProposalFootnoteSymbol, result.data[x].ProposalFootnoteText, result.data[x].Notes, result.data[x].ResearchNotes, result.data[x].ContextualNote);
							
							if (proposalInfo.Notes != '') {
								proposalInfo.Notes = '<div style="" class=\'RationaleText VotingRationaleText\'><i><div class=\'RationaleNotes\'>' + passLanguage.VotingRationale + ':</div>' + proposalInfo.Notes + '</i></div>';
							}
							if (proposalInfo.researchNotes != '') {
								proposalInfo.researchNotes = '<div style="" class=\'RationaleText ResearchRationaleText\'><i><div class=\'RationaleNotes\'>' + passLanguage.PolicyRationale + ':</div>' + proposalInfo.researchNotes + '</i></div>';
							}
							if (proposalInfo.mergedNotes != '') {
								proposalInfo.mergedNotes = '<div style=""  class=\'RationaleText MergeRationaleText\'><i><div class=\'RationaleNotes\'>' + passLanguage.Rationale + ':</div>' + proposalInfo.mergedNotes + '</i></div>';
							}
							if (proposalInfo.ProposalFootnote != '') {
								proposalInfo.ProposalFootnote = '<div style=""  class=\'ProposalFootnoteText\'><i><div class=\'RationaleNotes\'>' + passLanguage.Footnote + ':</div>' + proposalInfo.ProposalFootnote + '</i></div>';
							}

							result.data[x].Proposal = proposalInfo.Proposal + proposalInfo.Notes + proposalInfo.researchNotes + proposalInfo.mergedNotes + proposalInfo.ProposalFootnote;


							/*************************************************** */
							
                    }
					} // end of for loop  
				} // end of if 	
				for (i = 0; i < count.length; i++)
				{
				if (result.data[i].ProposalCategory == 'Reorg. and Mergers') {
					result.data[i].ProposalCategory = 'Reorganization and Mergers';
				}
				else if (result.data[i].ProposalCategory == 'Non-Salary Comp.') {
					result.data[i].ProposalCategory = 'Compensation';
				}
				else if (result.data[i].ProposalCategory == 'SH-Routine/Business') {
					result.data[i].ProposalCategory = 'Routine/Business';
				}
				else if (result.data[i].ProposalCategory == "SH-Dirs' Related") {
					result.data[i].ProposalCategory = 'Directors Related';
				}
				else if (result.data[i].ProposalCategory == "SH-Corp Governance") {
					result.data[i].ProposalCategory = 'Corporate Governance';
				}
				else if (result.data[i].ProposalCategory == "SH-Soc./Human Rights") {
					result.data[i].ProposalCategory = 'Social/Human Rights';
				}
				else if (result.data[i].ProposalCategory == "SH-Compensation") {
					result.data[i].ProposalCategory = 'Compensation';
				}
				else if (result.data[i].ProposalCategory == "SH-Gen Econ Issues") {
					result.data[i].ProposalCategory = 'General Economic Issues';
				}
				else if (result.data[i].ProposalCategory == "SH-Health/Environ.") {
					result.data[i].ProposalCategory = 'Health/Environmental';
				}
				else if (result.data[i].ProposalCategory == "SH-Other/misc.") {
					result.data[i].ProposalCategory = 'Other/Miscellaneous';
				}
				else if (result.data[i].ProposalCategory == "SH-Social Proposal") {
					result.data[i].ProposalCategory = 'Social Proposal';
				}				
				result.data[i].ProposalCategory = propsalCategoryLabel[result.data[i].ProposalCategory];

				//VDS-1391 - get the vote column overriden if VoteSharesVotedDetail is not null [START]
				var voteSharesVotedStr = vdsAppHelper.processVoteSharesVotedDetail(
					result.data[i],
					passLanguage
				  );
				  if(voteSharesVotedStr){
					  result.data[i].ClientVoteList = voteSharesVotedStr;
				  }
				//VDS-1391 - get the vote column overriden if VoteSharesVotedDetail is not null [END]

				if(result.data[i].ClientVoteList.includes(',')){
					var votes = result.data[i].ClientVoteList.split(', ');
					var distinctVotes = Array.from(new Set(votes)).toString();
					result.data[i].ClientVoteList = distinctVotes;
				}
			}
				

				return result.data;

			},
			/*total: function(data) {
				//total pages for the query
				//var result = parseResponse(data);
				//var pageTotal = (data.data.length)/20;
				var pageTotal = (data.data[0].TotalRows)/20;
				if(pageTotal >= parseInt(pageTotal))
					pageTotal = pageTotal+1;
				
				$('#PageVal').val(parseInt(pageTotal));
				
				return parseInt(pageTotal);
			},
			page: function(data){
				//current page of the query
				//var result = parseResponse(data);
				//return result.currentPage;
				return data.data[0].PageNumber;
				//return 1;
			},
			*/
			records: function(data) {
				return data.data.length;
			}
		},

		

		colNames: colNamesMeetingDetail,
		colModel: colModelMeetingDetail,//setcolModelMeetingDetail(this),

		//sortname: 'BallotItemNumber',
		sortname: colMeetingDetailColumnSort,
		viewrecords: true,
		rownumbers: false,
		sortorder: "asc",
		ignoreCase: true,
		gridview: true,
		pager: '#pagerDetail',
		height: "auto",
		loadtext: "<img src='/repo/app/img/bigrotation.gif'><span style='font-size: 20px; vertical-align:middle; padding-left: 5px'>" + passLanguage.Loading + "...</span>",
		//caption: "VDS",
		hiddengrid: true,
		/* rowNum: -1 ,	//show all records */
		rowNum: 2000, //set a big number so that rows are returned
		loadonce: true,
		altRows: true,
		altclass: 'AlternateRowClass',
		beforeSelectRow: function(rowid, e) {
			return false;
		},
		beforeRequest: function() {
			$('#load_listDetail').css('margin-top', '30px');
			//$('.loading').show();
			$('#load_listDetail').show();
			$('#meetingListGrid').width('100%');
			var outerwidth = $('#meetingListGrid').width();														
			$('#listDetail').setGridWidth(outerwidth);
		},
		/*onSortCol: function (index, iCol, sortorder) {    
			if(index === "BallotItemNumber"){
				index = "SeqNumber";              
			} 
		},*/

		gridComplete: function() {
			//var displayNotesTypeInfo = jQuery("#list").jqGrid('getGridParam', 'DisplayNotesTypeInfo');
			//adjustWidth_MeetingDetail();						

			$('#meetingListGrid').width('100%');
			//console.log($('#meetingListGrid').width());
			$("#listDetail").closest('.ui-jqgrid-bdiv').width($("#listDetail").closest('.ui-jqgrid-bdiv').width() + 1);

			var outerwidth = $('#meetingListGrid').width();
			//console.log(outerwidth);													
			$('#listDetail').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically						
			$('#meetingListGrid').width($('#meetingListGrid').width() + 2);
			//	console.log($('#meetingListGrid').width());
			//console.log('yo:'+displayNotesTypeInfo);

			//$("#listDetail").closest('.ui-jqgrid-bdiv').width($("#listDetail").closest('.ui-jqgrid-bdiv').width()+1);
			//$("#listDetail_ClientVoteList").css('width','209px');
			//$('.loading').hide();						
			$('#load_listDetail').hide();
			$('#pagerDetail').hide();
			//setTimeout(function () {							
			jQuery("#listDetail").trigger("reloadGrid");
			//}, 50);
			$(".ui-grid-ico-sort").each(function(index, value) {

				if ($(this).hasClass("ui-state-disabled")) {
					$(this).css('display', 'none');
				}

				if (!$(this).hasClass("ui-state-disabled")) {
					if ($(this).hasClass("ui-icon-asc")) {
						$(this).removeClass("ui-grid-ico-sort ui-icon-asc ui-icon ui-icon-triangle-1-n ui-sort-ltr").addClass("list-icon-sort-asc  glyphicon glyphicon-arrow-up");
						//$(this).css('display','inline');
					}

					if ($(this).hasClass("ui-icon-desc")) {
						$(this).removeClass("ui-grid-ico-sort ui-icon-desc ui-icon ui-icon-triangle-1-s ui-sort-ltr").addClass("list-icon-sort-desc  glyphicon glyphicon-arrow-down");
						//$(this).css('display','inline');
					}
				}

			});


			var sortColumnName = $("#listDetail").jqGrid('getGridParam', 'sortname');
			var sortOrder = $("#listDetail").jqGrid('getGridParam', 'sortorder');
			var sortName = "jqgh_" + sortColumnName;

			$('#' + sortName + ' span span').each(function(index, value) {
				//console.log($(this).attr('sort'));

				if ($(this).attr('sort') == sortOrder) {
					$(this).css('display', 'inline');
				}
				else {
					$(this).css('display', 'none');
				}

			});

			if (sortName == "jqgh_BallotItemNumber") {
				$("#" + sortName).css("padding-left", "21px");
			}
			else {
				$("#jqgh_BallotItemNumber").css("padding-left", "0px");
			}
			//VDS-990: Significant Vote column - [START]
			if (sortName == "jqgh_SignificantProposalYN") {
				$("#" + sortName).css("padding-left", "21px");
			}
			else {
				$("#jqgh_SignificantProposalYN").css("padding-left", "0px");
			}
			//VDS-990: Significant Vote column - [END]
			if (sortName == 'jqgh_Proposal') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_Proposal').css('padding-left', '0px');
			}

			if (sortName == 'jqgh_ShareholderProposal') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_ShareholderProposal').css('padding-left', '0px');
			}


			if (sortName == 'jqgh_MgtRecVote') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_MgtRecVote').css('padding-left', '0px');
			}

			if (sortName == 'jqgh_ClientVoteList') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_ClientVoteList').css('padding-left', '0px');
			}
			
			if (sortName == 'jqgh_ProposalCategory') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_ProposalCategory').css('padding-left', '0px');
			}

			if (sortName == 'jqgh_EsgPillar') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_EsgPillar').css('padding-left', '0px');
			}
      
     //VDS-1391 - padding fix for sort icon [START]
			if (sortName == 'jqgh_NPXSecProposalCategory') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_NPXSecProposalCategory').css('padding-left', '0px');
			}

			if (sortName == 'jqgh_SharesVoted') {
				$('#' + sortName).css('padding-left', '21px');
			}
			else {
				$('#jqgh_SharesVoted').css('padding-left', '0px');
			}			
    //VDS-1391 - padding fix for sort icon [END]


			var ids = jQuery("#listDetail").jqGrid('getDataIDs');
			var rowData = jQuery('#listDetail').jqGrid('getRowData', ids[0]);

			if (rowData.MeetingFootnoteSymbol != null && rowData.MeetingFootnoteSymbol != '' && rowData.MeetingFootnoteText != null && rowData.MeetingFootnoteText != '') {
				var footSymbol_Text = rowData.MeetingFootnoteSymbol + ' ' + rowData.MeetingFootnoteText;
				//var CompanyNameDetailStr = '<span title="'+footSymbol_Text+'">'+rowData.CompanyNameDetail+ ''+rowData.MeetingFootnoteSymbol+'</span>';
				var CompanyNameDetailStr = rowData.CompanyNameDetail + '' + rowData.MeetingFootnoteSymbol;
				var tooltipText = footSymbol_Text;
				if (rowData.MeetingFootnoteSymbol == undefined)
					rowData.MeetingFootnoteSymbol = '';
				var CompanyTextVal = rowData.CompanyNameDetail + '' + rowData.MeetingFootnoteSymbol;
				$('#companyName').attr('onMouseOver', 'showGridTooltip(this,"' + tooltipText + '",event)');
				$('#companyName').attr('onMouseOut', 'hideGridTooltip(this)');

				var CompanyNameDetailStr = CompanyTextVal + '<span class="gridTooltipClass">' + tooltipText + '</span>';
			}
			else {
				var CompanyNameDetailStr = rowData.CompanyNameDetail;
				$('#companyName').attr('onMouseOver', '');
				$('#companyName').attr('onMouseOut', '');
			}
			$('#companyName').html(CompanyNameDetailStr);
			if(passLanguage.Yes!=undefined && passLanguage.Yes!='' && signMeeting == passLanguage.Yes){
			$('#significantDetailView').html(""+passLanguage.signMeeting+"");
			$('#significantDetailView').show();	
			}else if(signMeeting === 'Yes'){
			$('#significantDetailView').html("Significant Meeting");
			$('#significantDetailView').show();
			}
			
			if (rowData.TickerDetail == '(Blanks)')
				rowData.TickerDetail = '';
			$('#ticker').html(rowData.TickerDetail);
			if (rowData.MeetingDateDetail == null || rowData.MeetingDateDetail == '') {
				$('#meetingDate').html('');
			}
			else {
				var md = new Date(rowData.MeetingDateDetail.replace(' 00:00:00.0', ''));
				//var md =  rowData.MeetingDate;						
				$('#meetingDate').html($.datepicker.formatDate('dd-M-yy', new Date(md.getTime() + md.getTimezoneOffset() * 60000)));
			}
			if (rowData.RecordDateDetail == null || rowData.RecordDateDetail == '') {
				$('#recordDate').html('');
			}
			else {
				var rd = new Date(rowData.RecordDateDetail.replace(' 00:00:00.0', ''));
				//var rd =  rowData.RecordDate;
				$('#recordDate').html($.datepicker.formatDate('dd-M-yy', new Date(rd.getTime() + rd.getTimezoneOffset() * 60000)));
			}
			$('#securityID').html(rowData.SecurityIDDetail);
			//$('#meetingType').html(rowData.MeetingTypeDetail);
			$('#meetingType').html(meetingTypeList[rowData.MeetingTypeDetail.trim()]!=undefined ? meetingTypeList[rowData.MeetingTypeDetail.trim()] :rowData.MeetingTypeDetail.trim());
			//console.log("Ankit "+rowData.MeetingTypeDetail);
			$('#industrySector').html(rowData.SixDigitSectorType);
			$('#country').html(vdsAppHelper.getLangProperty(rowData.CountryDetail));
			$('#sharesOnLoan').html(rowData.SharesOnLoanDetail);

		//	console.log(rowData.FundFootnoteText);
			if (rowData.FundFootnoteText.trim() != '' && rowData.FundFootnoteText.trim() != null) {
				rowData.FundFootnoteText = rowData.FundFootnoteText.trim();
				var fFootNoteTxtArr = rowData.FundFootnoteText.split(' || ');
				//var fFootNoteTxtArr = rowData.FundFootnoteText.split(' ** ');
			}
			else {
				//var fFootNoteTxtArr = '';
				var fFootNoteTxtArr = '';
			}

			if (rowData.FundFootnoteSymbol != '' && rowData.FundFootnoteSymbol != null) {
				var fFootNoteSymbolArr = rowData.FundFootnoteSymbol.split(' || ');
				//var fFootNoteSymbolArr = rowData.FundFootnoteSymbol.split(' ** ');
			}
			else {
				var fFootNoteSymbolArr = '';
			}
			var i;
			var fs = new Object;
			var fn_all = new Array();
			var tmp = 0;


			//console.log(fFootNoteTxtArr.length);
			//console.log(rowData.FundFootnoteText+'=>'+fFootNoteTxtArr);
			//console.log(rowData.FundFootnoteSymbol+'=>'+fFootNoteSymbolArr);


			var fn = rowData.FundNames.split('~~');
			fn = fn.sort();
			//console.log(fn);
			for (var j = 0; j < fn.length; j++) {
				if (fFootNoteTxtArr.length > 0) {
					for (i = 0; i < fFootNoteTxtArr.length; i++) {

						var abcd = String(fFootNoteTxtArr[i]);
						t = abcd.split(' ** ');

						var xyz = String(fFootNoteSymbolArr[i]);
						s = xyz.split(' ** ');

						//console.log(fn[j].trim()+'----------'+t[0].substring(1));
						//console.log('='+fn[j].trim()+'==TTT----------'+t[0]+'='+t[1]);
						//console.log('SSS=='+s[0]+'----------'+s[1]+'=');
						if (fn[j].trim() == t[0]) {
							if (s[1] == undefined)
								s[1] = '';
							var tooltipText = s[1] + ' ' + t[1];
							if (j == fn.length - 1 && i == fFootNoteTxtArr.length - 1) {
								var fundTxtTmp = t[0] + '' + s[1] + '';
							}
							else if (j!==(fn.length-1)) {
								var fundTxtTmp = t[0] + '' + s[1] + ',&nbsp;';
							}
							else {
								var fundTxtTmp = t[0] + '' + s[1] + '&nbsp;';
							}
							//fn_all[j] = '<td onmouseout="hideGridTooltip(this)" onmouseover="showGridTooltip(this,\''+tooltipText+'\',event)" style="font-size: 12px; display: inline;">'+fundTxtTmp+'<span class="gridTooltipClass">'+ tooltipText +'</span></td>';
							fn_all[j] = '<span onmouseout="hideGridTooltip(this)" onmouseover="showGridTooltip(this,\'' + '' + '\',event)" style="font-size: 12px; display: inline; position: relative;">' + fundTxtTmp + '<span class="gridTooltipClass" style="position: absolute; top: -20px; left: 0; background-color: #fff; border: 1px solid #ccc; padding: 5px;">' + tooltipText + '</span></span>'; 							;
							break;

						}
						else {
							if (j == fn.length - 1 && i == fFootNoteTxtArr.length - 1) {
								//fn_all[j] = '<td>'+fn[j]+''+'</td>';
								fn_all[j] = '' + fn[j] + '' + '';
							}
							else {
								//fn_all[j] = '<td>'+fn[j]+',&nbsp;'+'</td>';
								fn_all[j] = '' + fn[j] + ',&nbsp;' + '';
							}
						}
					}
				}
				else {
					//fn_all = '<td>'+fn+'</td>';
					fn_all[0] = '<span>' + fn + '</span>';
				}

			}

			

			//console.log(fn_all);		
			//console.log(JSON.stringify(fs));
			//console.log(JSON.stringify(fn_all));
			//console.log("fn_all.join=>"+fn_all.join(''));


			//fn.sort();	
			//fn_all.sort();
			$('#fundNames').html('');
			//$('#fundNames').html('<table><tr><td>Funds that held this meeting include:&nbsp;&nbsp;</td>'+fn_all.join('')+'</tr></table>');	

			$('#fundNames').html('<table><tr><td class="fundNamesLine" >' + passLanguage.meetingDetailFooterInfo + '</td><td>' + fn_all.join('') + '</td></tr></table>');
			$('#fundNames').html($('#fundNames').html().substr($('#fundNames').html().indexOf('<table>'), $('#fundNames').html().length));; 						// remove first few commas
			$('#companyData').show();
			$('#fundData').show();
			$("html, body").animate({ scrollTop: $("#meetingListGrid").offset().top - 100 }, 500);


		}
	}).jqGrid('navGrid', '#pagerDetail',
		{ edit: false, add: false, del: false, search: false, refresh: false });
	grid.jqGrid('setColProp', 'SeqNumber',
		{
			searchoptions: {
				sopt: ['cn'],
				dataInit: function(elem) {
					$(elem).autocomplete({
						source: getUniqueNames('SeqNumber'),
						delay: 0,
						minLength: 0
					});
				}
			}
		});

		

	/*grid.jqGrid('filterToolbar',
		{stringResult:true, searchOnEnter:true, defaultSearch:"cn"});*/

	//console.log(document.getElementById("meetingType_Image").src);

	/*
	var mtSrc = document.getElementById("meetingType_Image").src;
	if(mtSrc.indexOf('collapse.png') > 0)
	{
		$("#meetingListGrid").appendTo("#MeetingType_list");
	}
	var mmSrc = document.getElementById("meetingMarket_Image").src;
	if(mmSrc.indexOf('collapse.png') > 0)
	{
		$("#meetingListGrid").appendTo("#MeetingMarket_list");
	}
	*/
	//console.log(document.getElementById("meetingMarket_Image").src);

	parentDiv = $('#meetingDisplayGrid').parent().attr("id");
	//console.log(parentDiv);
	$("#meetingListGrid").appendTo("#" + parentDiv);

	//$("#meetingListGrid").appendTo("#MeetingMarket_list");
	$("#meetingListGrid").show('500');

	//$('#listDetail').on('reloadGrid', adjustWidth_MeetingDetail());


	$(window).resize(function() {
		if ($("#meetingListGrid").css("display") == 'block') {
			$('#meetingListGrid').width('100%');
			adjustWidth_MeetingDetail();
		}
	});

}

function adjustWidth_MeetingDetail() {
	/*var outerwidth = $('#meetingListGrid').width();		
	$('#meetingDisplayGrid').width($('#meetingListGrid').width()+2);		
	$('#listDetail').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically		
	$("#listDetail").closest('.ui-jqgrid-bdiv').width($("#listDetail").closest('.ui-jqgrid-bdiv').width()+1);
	*/

	var outerwidth = $('#meetingListGrid').width();
	$('#listDetail').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically
	//$("#listDetail").closest('.ui-jqgrid-bdiv').width($("#listDetail").closest('.ui-jqgrid-bdiv').width()+1);
	$('#meetingListGrid').width($('#meetingListGrid').width() + 2);

}

function parseVotes(cellvalue, options, rowObject) {

	var languageProperties = {};
	
	var str = "" + cellvalue + "";
    var returnVal;
    var final;
    if (str.indexOf(" , ,") === 0) {
        final = "";
	    returnVal = final;
      // return final;
    } else {
        var strArr = str.split(",");
        //console.log(strArr);
        //str = (strArr.length ? "'" + strArr.join("','") + "'" : "")
        var result = [];
        var futureVotesString = false;
        $.each(strArr, function (i, v) {
        if ($.inArray(v.trim(), result) == -1) result.push(v.trim());

        if (v == " *" || v == "*") {
          //check for future votes string, show 'futureMeetingText' if future vote string found
          futureVotesString = true;
          $("#futureMeetingText").show();
        }
      });
      //console.log(result);

        var finalResult = [];
        var dnvFound = 0;
        $.each(result, function (i, v) {
        if (v == " Did Not Vote") {
          dnvFound = 1;
        } else {
          if (finalResult.length == 0) 
			finalResult.push(v);
          else 
		  finalResult.push("&ensp;" + v);
        }
      });

        if (dnvFound == 1) {
            if (finalResult.length == 0) 
			    finalResult.push("Did Not Vote");
            else 
				finalResult.push(" Did Not Vote");
        }

        var resStr = finalResult.toString();
	    returnVal = resStr;
        //resStr = "sdsd";
    }
    var voteSharesVotedStr = vdsAppHelper.processVoteSharesVotedDetail(rowObject);
    if(voteSharesVotedStr){
	    returnVal = voteSharesVotedStr;
    }
    return returnVal;
}
function proposalCategoryAndSubCategory(cellvalue, options, rowObject){

	var proposalCategoryValue = rowObject.ProposalCategory;
	var proposalSubCategoryValue = rowObject.ProposalSubCategory;
	var proposalValues = "";
	var proposalCategoryTooltip = "";
	if( proposalCategoryValue !== null && proposalCategoryValue!==undefined &&  proposalCategoryValue != '')
	{
		proposalValues += '<div style="">' + vdsAppHelper.getLangProperty(proposalCategoryValue) + '</div>' ;
		proposalCategoryTooltip+=vdsAppHelper.getLangProperty(proposalCategoryValue);
	}
	if ( proposalSubCategoryValue !== null && proposalSubCategoryValue!==undefined &&  proposalSubCategoryValue != '')
	{
		proposalValues += '</br><div style="margin-top: -22px;font-size: 10px;">' + vdsAppHelper.getLangProperty(proposalSubCategoryValue)+ '</div>';
		proposalCategoryTooltip+="\n"+vdsAppHelper.getLangProperty(proposalSubCategoryValue);
	}
	var proposalTooltip = _.escape(proposalCategoryTooltip);
	return "<div title='"+proposalTooltip+"'>"+proposalValues+"</div";


}

function parseESG(cellvalue, options, rowObject){ 
	var esgIcons = "";
	var esgValues = rowObject.EsgPillar;
	var esgArr;
	if(typeof esgValues === 'string'){
	 esgArr = esgValues.split(",");
	}
	if(esgArr != undefined || esgArr != null){
		
		esgArr.forEach(function(element){
			if(element.trim() === "E"){
				var environmental = vdsAppHelper.getLangProperty("Environmental");
				esgIcons += '<img src ="../repo/app/img/pillars-environment.svg" title="'+environmental+'" style="margin-left: 1px;margin-right: 1px; width:20%"> ';
			}
			if(element.trim() === "S"){
				var social = vdsAppHelper.getLangProperty("Social");
				esgIcons += '<img src ="../repo/app/img/pillars-social.svg" title="'+social+'" style="margin-left: 1px;margin-right: 1px; width:20%">';
			}
			if(element.trim() === "G"){
				var governance = vdsAppHelper.getLangProperty("Governance");
				esgIcons += '<img src = "../repo/app/img/pillars-governance.svg" title="'+governance+'" style="margin-left: 1px;margin-right: 1px; width:20%">'   ;
			}
			}
		);
		
	}
	return "<div style='text-align: center !important; display: flex; justify-content: center;'>"+esgIcons+"</div";
}


function parseProposal(cellvalue, options, rowObject) {

	var displayNotesTypeInfo = jQuery("#list").jqGrid('getGridParam', 'DisplayNotesTypeInfo');
	var proposalInfo = computeProposalNotes(displayNotesTypeInfo, rowObject.Proposal, rowObject.ProposalFootnoteSymbol, rowObject.ProposalFootnoteText, rowObject.Notes, rowObject.ResearchNotes, rowObject.ContextualNote);

	if (proposalInfo.Notes != '') {
		proposalInfo.Notes = '<div style="" class=\'RationaleText VotingRationaleText\'><i>Voting Rationale:&nbsp<br>' + proposalInfo.Notes + '</i></div>';
	}
	if (proposalInfo.researchNotes != '') {
		proposalInfo.researchNotes = '<div style="" class=\'RationaleText ResearchRationaleText\'><i>Policy Rationale:&nbsp<br>' + proposalInfo.researchNotes + '</i></div>';
	}
	if (proposalInfo.mergedNotes != '') {
		proposalInfo.mergedNotes = '<div style=""  class=\'RationaleText MergeRationaleText\'><i>Rationale:&nbsp<br>' + proposalInfo.mergedNotes + '</i></div>';
	}
	if (proposalInfo.ProposalFootnote != '') {
		proposalInfo.ProposalFootnote = '<div style=""  class=\'ProposalFootnoteText\'><i>Footnote:&nbsp<br>' + proposalInfo.ProposalFootnote + '</i></div>';
	}

	return proposalInfo.Proposal + proposalInfo.Notes + proposalInfo.researchNotes + proposalInfo.mergedNotes + proposalInfo.ProposalFootnote;
}

function parseShareholderProposal(cellvalue, options, rowObject) {
	var localLang = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);

	if (localLang !== 'de' && localLang !== 'nl' && localLang !== 'en' && localLang !== 'fr') {
		localLang = 'en';
	}
	var Management_en = "Management";
	var Management_de = "Germandsss";
	var Management_fr = "Frwnnssss";
	var Management_nl = "Dutchchch";

	var Shareholder_en = "Shareholder";
	var Shareholder_de = "Gerssmandsss";
	var Shareholder_fr = "Fssrwnnssss";
	var Shareholder_nl = "Dusstchchch";

	// console.log(.getPreferLanvdsServicesguageProperties().Shareholder);


	var resStr = '';
	if (cellvalue === '' || cellvalue === -1) {
		resStr = '';
	}
	else if (cellvalue === 0) {
		//resStr = eval('Management_'+localLang);
		resStr = 'Management';
	}
	else if (cellvalue === 1) {
		resStr = 'Shareholder';
	}
	return resStr;
}

function setSortBallotItemNumber(cellValue, rowObject) {
	return rowObject.SeqNumber;
}



function loadMeetingList() {
	// VDS-990: - [START]
	if(vdsAppHelper.vdsBodyAjScope !== null) {
		delete vdsAppHelper.vdsBodyAjScope["significantVoteFilter"];
	}
	// VDS-990: - [END]

	$("#meetingListGrid").hide('500');

	//unload (clear) jqgrid after back buttom is clicked, also clear the company data 
	$("#listDetail").jqGrid('GridUnload');
	$('#companyName').html('');
	$('#significantDetailView').html('');
	$('#significantDetailView').hide();
	$('#ticker').html('');
	$('#meetingDate').html('');
	$('#recordDate').html('');
	$('#securityID').html('');
	$('#meetingType').html('');
	$('#industrySector').html('');
	$('#country').html('');
	$('#cusip').html('');
	$('#isin').html('');
	$('#sharesOnLoan').html('');
	selectedSecurityId = null;
	$("#meetingDisplayGrid").show('500');

	$("html, body").animate({ scrollTop: $("#meetingDisplayGrid").offset().top - 100 }, 500);

	/*$('#meetingListGrid').width('100%');
	var outerwidth = $('#meetingListGrid').width();							
	$('#listDetail').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically			
	$("#listDetail").closest('.ui-jqgrid-bdiv').width($("#listDetail").closest('.ui-jqgrid-bdiv').width()+1);
	*/
	/*
	var outerwidth = $('#meetingListGrid').width();
	$('#meetingDisplayGrid').width(outerwidth);		
	$('#meetingDisplayGrid').width('100%');		
	var outerwidth = $('#meetingDisplayGrid').width();											
	$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically
	//$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width()+1);
	$('#meetingDisplayGrid').width($('#meetingDisplayGrid').width()+2);
	*/

	setTimeout(function() {
		$('#meetingDisplayGrid').width('100%');
		//adjustWidth_MeetingList();
		var outerwidth = $('#meetingDisplayGrid').width();
		$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically
		//$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width()+1);
		$('#meetingDisplayGrid').width($('#meetingDisplayGrid').width() + 2);
	}, 505);

	/*
	$('#meetingDisplayGrid').width('100%')
	var outerwidth = $('#meetingDisplayGrid').width();							
	$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically		
	$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width()+1);		
	
	setTimeout(function() {
			var outerwidth = $('#meetingDisplayGrid').width();							
			$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically
			
			$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width()+1);
			var t_width = $("#list_VoteFlag").css('width');
			t_width = t_width.replace('px','');
			t_width = parseInt(t_width)+2;
			//$("#list_VoteFlag").css('width',t_width+'px');
				}, 505); 
	*/
}

function setInputStyle() {
	$('ul.dropdown-menu').eq(1).css('left', 'auto');
	//$('ul.dropdown-menu').eq(1).css('right','0')
	$('ul.dropdown-menu').eq(1).css('float', 'auto');

	//$('ul.dropdown-menu').addClass('col-md-10 col-sm-12 col-xs-12');
	if (GetIEVersion() == 0)	//non IE
	{
		$('ul.dropdown-menu').css('padding-top', '5px');
		$('ul.dropdown-menu').css('padding-right', '5px');
		$('ul.dropdown-menu').css('padding-bottom', '3px');
		$('ul.dropdown-menu').css('padding-left', '3px');
	}
	else {
		$('ul.dropdown-menu').css('padding-top', '5px');
		$('ul.dropdown-menu').css('padding-right', '5px');
		$('ul.dropdown-menu').css('padding-bottom', '7px');
		$('ul.dropdown-menu').css('padding-left', '7px');

	}
}

function setInputStyleleft() {
	$('ul.dropdown-menu').eq(1).css('left', 'auto');
	//$('ul.dropdown-menu').addClass('col-md-10 col-sm-12 col-xs-12');

	if (GetIEVersion() == 0)	//non IE
	{
		$('ul.dropdown-menu').css('padding-top', '5px');
		$('ul.dropdown-menu').css('padding-right', '5px');
		$('ul.dropdown-menu').css('padding-bottom', '3px');
		$('ul.dropdown-menu').css('padding-left', '3px');
	}
	else {
		$('ul.dropdown-menu').css('padding-top', '5px');
		$('ul.dropdown-menu').css('padding-right', '5px');
		$('ul.dropdown-menu').css('padding-bottom', '7px');
		$('ul.dropdown-menu').css('padding-left', '7px');

	}
}

function GetIEVersion() {
	/*
	var sAgent = window.navigator.userAgent;
	var Idx = sAgent.indexOf("MSIE");

	// If IE, return version number.
	if (Idx > 0) 
	  return parseInt(sAgent.substring(Idx+ 5, sAgent.indexOf(".", Idx)));

	// If IE 11 then look for Updated user agent string.
	else if (!!navigator.userAgent.match(/Trident\/7\./)) 
	  return 11;

	else
	  return 0; //It is not IE
   */

	var rv = 0; // Return value assumes failure.
	if (window.navigator.appName == 'Microsoft Internet Explorer') {
		var ua = window.navigator.userAgent;
		var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		if (re.exec(ua) != null) {
			//rv = parseFloat( RegExp.$1 );
			rv = parseInt(RegExp.$1);
		}

	}
	return rv;
}


function placeHolderFix() {
	$('[placeholder]').focus(function() {
		var input = $(this);
		if (input.val() == input.attr('placeholder')) {
			input.val('');
			input.removeClass('placeholder');
		}

	}).blur(function() {
		var input = $(this);
		if (input.val() == '' || input.val() == input.attr('placeholder')) {
			input.addClass('placeholder');
			input.val(input.attr('placeholder'));
		}
	}).blur();

	$('[placeholder]').parents('form').submit(function() {
		$(this).find('[placeholder]').each(function() {
			var input = $(this);
			if (input.val() == input.attr('placeholder')) {
				input.val('');
			}
		})
	});
}

function submitFilter(el, whichEle) {

	var ul_Ele = 'ul.countryMultiSelectUL li';
	if (whichEle == 'country') {
		ul = 'ul.countryMultiSelectUL';
		ul_Ele = 'ul.countryMultiSelectUL li';
		whichSearch = 'input.countryInputSearch';
		whichButton = 'button.countryMultiSelectButton';
		whichSelect = '.countryMultiSelectClass';
		whichClearInput = '.clearInputStyleCountry';
	}
	else if (whichEle == 'fund') {
		ul = 'ul.fundMultiSelectUL';
		ul_Ele = 'ul.fundMultiSelectUL li';
		whichSearch = 'input.fundInputSearch';
		whichButton = 'button.fundMultiSelectButton';
		whichSelect = '.fundMultiSelectClass';
		whichClearInput = '.clearInputStyleFund';
	}
	else if (whichEle == 'fundfamily') {
		ul = 'ul.fundFamilyMultiSelectUL';
		ul_Ele = 'ul.fundFamilyMultiSelectUL li';
		whichSearch = 'input.fundFamilyInputSearch';
		whichButton = 'button.fundFamilyMultiSelectButton';
		whichSelect = '.fundFamilyMultiSelectClass';
		whichClearInput = '.clearInputStyleFundFamily';
	}

	var deselectItems = new Array;
	var selectItems = new Array;
	var selectItemsVal = new Array;
	var di = 0;
	var si = 0;

	var selectme = new Array;
	$(ul + ' > li:visible > a > label > input:checked').each(function() {
		if ($(this).attr('value') != 'select-all-country' && $(this).attr('value') != 'select-all-fund' && $(this).attr('value') != 'select-all-fundfamily')
			selectme.push($(this).attr('value'));
		if (whichEle == 'fund') {
			if ($(this).parent().attr('title') != undefined && $(this).parent().attr('title') != '') {
				selectItemsVal.push($(this).parent().attr('title'));
			}

		}

	});

	$(whichButton).parent().removeClass('open'); //close filter before, so that less delay is seen on screen to user

	$(whichSelect).val(selectme);


	//console.log('no deselectItems=>'+deselectItems.length);
	//console.log('deselectItems=>'+deselectItems);
	//console.log('no selectItems=>'+selectItems.length);
	//console.log('selectItems=>'+selectItems);
	//$("button.countryMultiSelectButton").parent().removeClass('open');


	//$('.countryMultiSelectClass').multiselect('deselect', deselectItems);
	//$('.countryMultiSelectClass').multiselect('select', selectItems);
	//$(whichSelect).multiselect('deselect', deselectItems);
	//$(whichSelect).multiselect('select', selectItems);
	$(whichSelect).multiselect('refresh');

	//console.log($(whichSelect+" :selected").length+'=>'+$(whichSelect+" option"));


	var $scope = angular.element(el).scope();

	if (whichEle == 'country') {
		$scope.countryMultiSelectArr = selectme;
		$scope.countryMultiSelectTempArr = selectme;
	}
	else if (whichEle == 'fund') {
		$scope.fundMultiSelectArr = selectme;
		$scope.fundMultiSelectTempArr = selectme;
		if (whichEle == 'fund') {
			setTimeout(function() {
				$("button.fundMultiSelectButton").attr('title', selectItemsVal.join(', '));
			}, 500);
		}

	}
	else if (whichEle == 'fundfamily') {
		$scope.fundFamilyMultiSelectArr = selectme;
		$scope.fundFamilyMultiSelectTempArr = selectme;
	}


	if (whichEle == 'fundfamily') {
		loadFundsFromFamily($scope);
	}

	$scope.formDirty = true;
	$scope.$apply();

	$(whichClearInput).hide();
	//$("input.multiselect-search").val('');
	if ($(whichSearch).val() != '') {
		//console.log('save');
		$(whichSearch).val('');
		if (GetIEVersion() == 9) {
			$(whichSearch).trigger("input");
		}
		else {
			$(whichSearch).trigger("input");
			//$(whichSearch).trigger("change");
		}

	}


}

function cancelFilter(el, whichEle) {

	var $scope = angular.element(el).scope();

	var ul_Ele = 'ul.countryMultiSelectUL li';
	if (whichEle == 'country') {
		ul_Ele = 'ul.countryMultiSelectUL li';
		whichSearch = 'input.countryInputSearch';
		whichButton = 'button.countryMultiSelectButton';
		whichSelect = '.countryMultiSelectClass';

		if ($(whichSearch).val() != '') {
			$(whichSearch).val('');
			$(whichSearch).trigger("input");
		}
		$(whichButton).parent().removeClass('open');
		//$(whichSelect).val('[""]');
		//$(whichSelect).multiselect('deselect', $scope.countryMultiSelectDefaultArr);	
		$(whichSelect).multiselect("deselectAll", false);
		$(whichSelect).multiselect('select', $scope.countryMultiSelectArr);


	}
	else if (whichEle == 'fund') {
		ul_Ele = 'ul.fundMultiSelectUL li';
		whichSearch = 'input.fundInputSearch';
		whichButton = 'button.fundMultiSelectButton';
		whichSelect = '.fundMultiSelectClass';

		if ($(whichSearch).val() != '') {
			$(whichSearch).val('');
			$(whichSearch).trigger("input");
		}
		$(whichButton).parent().removeClass('open');
		//$(whichSelect).val('[""]');
		$(whichSelect).multiselect("deselectAll", false);
		$(whichSelect).multiselect('select', $scope.fundMultiSelectArr);

	}
	else if (whichEle == 'fundfamily') {
		ul_Ele = 'ul.fundFamilyMultiSelectUL li';
		whichSearch = 'input.fundFamilyInputSearch';
		whichButton = 'button.fundFamilyMultiSelectButton';
		whichSelect = '.fundFamilyMultiSelectClass';

		if ($(whichSearch).val() != '') {
			$(whichSearch).val('');
			$(whichSearch).trigger("input");
		}
		$(whichButton).parent().removeClass('open');
		//$(whichSelect).val('[""]');
		$(whichSelect).multiselect("deselectAll", false);
		$(whichSelect).multiselect('select', $scope.fundFamilyMultiSelectArr);

	}

	//$(whichButton).parent().removeClass('open');
	$('.clear_input').hide();
	$(whichSearch).val('');


	//$(whichSelect).multiselect('refresh');	
	/*
	if (whichEle == 'fundfamily')
	{
		loadFundsFromFamily($scope);
	}
	*/
}

function loadFundsFromFamily(scope) {


	var ff_selectedLength = $(".fundFamilyMultiSelectClass :selected").length;
	var ff_optionLength = $(".fundFamilyMultiSelectClass option").length;

	var selectedFamily = new Array;
	var sff = 0;
	$(".fundFamilyMultiSelectClass option").each(function() {
		if ($(this).is(':selected')) {
			selectedFamily[sff] = $(this).val();
			sff++;
		}
	});



	var selectTheseFunds = '';
	var selectTheseFundsArr = [];
	var fundMultiSelectOptions = [];

	var $scope = scope;
	var optionIsSelected = true;
	if ($scope.showfundfamily == true) {
		angular.forEach($scope.fundList, function(val, key) {


			/*
			if($("option[value="+val.fundID+"]", $('.fundMultiSelectClass')).prop('selected') == true || $(".fundMultiSelectClass :selected").length == 0)	
			{
				 optionIsSelected = true;
			}
			else
			{
				optionIsSelected = false;
			}
			*/
			if (val.FileName != null && val.FileName != '') {
				var fundFileName = '../repo/441/policies/' + val.FileName;
				//var fundText = value.fundName + '<a href="'+value.FileName+'" target=\'_blank\' style="text-decoration: none; color: #C90101;"><span class="icon vds-pdf" style="font-size :16px; color:#C90101; vertical-align: top;"></span></a>';
				var fundText = val.fundName + '<a href="' + fundFileName + '" target=\'_blank\' style="text-decoration: none; color: #C90101;">&nbsp;<img style="width:10%;vertical-align: top;" src="../repo/441/img/pdf.png"></a>';

			}
			else {
				var fundText = val.fundName;
			}
			optionIsSelected = true;
			if (ff_selectedLength == ff_optionLength || ff_selectedLength == 0) {
				//optionIsSelected = true;
				//fundMultiSelectOptions.push({label: val.fundName, title: val.fundName, value: val.fundID, selected: optionIsSelected});
				fundMultiSelectOptions.push({ label: fundText, title: val.fundName, value: val.fundID, selected: optionIsSelected });
				if (selectTheseFunds != '') {
					selectTheseFunds += '||' + val.fundID + '=>' + val.fundName;
				}
				else {
					selectTheseFunds += val.fundID + '=>' + val.fundName;
				}
				selectTheseFundsArr.push(val.fundName);
			}
			else {
				for (x in selectedFamily) {
					if (selectedFamily[x] == val.FundFamilyID && val.FundFamilyID != null) {
						if (selectTheseFunds != '') {
							selectTheseFunds += '||' + val.fundID + '=>' + val.fundName;
						}
						else {
							selectTheseFunds += val.fundID + '=>' + val.fundName;
						}


						fundMultiSelectOptions.push({ label: fundText, title: val.fundName, value: val.fundID, selected: optionIsSelected });
						selectTheseFundsArr.push(val.fundName);
					}
				}

			}

		});


		$(".fundMultiSelectClass").multiselect('dataprovider', fundMultiSelectOptions);
		$("button.fundMultiSelectButton").attr('title', selectTheseFundsArr.join(', '));
		/*
		$("input.fundInputSearch").css('width','220px');
		$("input.fundInputSearch").css('height','30px');
		$("input.fundInputSearch").css('padding-right','30px');
		*/

		$(".fundMultiSelectUL").find(".input-group-addon").hide();
		$(".fundMultiSelectUL").find(".input-group-btn").hide();
	}



}

function decodeHtml(html) {
	var txt = document.createElement("textarea");
	txt.innerHTML = html;
	return txt.value;
}



function getLanguageJSON(callback, passcustomerID) {

	var lang = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
	console.log(lang);
	console.log(passcustomerID);
	if (lang !== 'de' && lang !== 'fr' && lang !== 'nl' && lang !== 'en') {
		console.log("Its inside");
		lang = 'en';
	}

	console.log(lang);
	var baseURL = window.location.protocol + '//' + restConfig.host + '/';
	var LanguageURL = baseURL + 'repo/' + passcustomerID + '/LanguageProperties_' + lang + '.json';

	if (passcustomerID === undefined) {
		console.log('not passed');
		LanguageURL = baseURL + 'repo/app/LanguageProperties_' + lang + '.json';
	}
	else {
		LanguageURL = baseURL + 'repo/' + passcustomerID + '/LanguageProperties_' + lang + '.json';
	}

	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', LanguageURL, false);
	xobj.onreadystatechange = function() {
		if (xobj.readyState == 4 && xobj.status == "200") {

			callback(xobj.responseText);
		}
	};
	xobj.send(null);


}
function findUnique(val,uniqueFundFamily)
{
	status = '0';
	uniqueFundFamily.forEach(function(itm){			  
		if(itm==val)
			{ 
				status=1;
			}})
	return status;
}



/*
function setcolModelMeetingDetail(el)
{
	
	//var $scope = angular.element(el).scope();				
	//console.log($scope.commonDashboardProperties.colNamesMeetingDetail);
	var formattedJson=new Object;
	var jsonObj = colModelMeetingDetail;			
						
	var mc=0;							
	var x;
						
	for(x in jsonObj)
	{
			if(jsonObj[x].formatter != '')	
			{
				jsonObj[x].formatter=eval(jsonObj[x].formatter);					
			}
			if(jsonObj[x].sorttype != '')	
			{
				jsonObj[x].sorttype=eval(jsonObj[x].sorttype);					
			}
			mc++;
	}
					
	return jsonObj;
}
*/


$(document).ready(function() {
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf("MSIE ");
	if (msie > 0) {      // If Internet Explorer, return version number
		setTimeout('placeHolderFix();', 500);
	}
});


function delAlertMessage(value)
{
	 $( '.'+value+'' ).remove();
}

function wrap(text) {
    text.each(function() {
        var text = d3.select(this);
        var words = text.text().split(/\s+/).reverse();
        var lineHeight = 20;
        var width = parseFloat(text.attr('width'));
        var y = parseFloat(text.attr('y'));
        var x = text.attr('x');
        var anchor = text.attr('text-anchor');
    
        var tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('text-anchor', anchor);
        var lineNumber = 0;
        var line = [];
        var word = words.pop();
        var i=words.length;
        while (i>=0) {
            line.push(word);
            tspan.text(line.join(' '));
            if (tspan.node().getComputedTextLength() > width) {
                lineNumber += 1;
                line.pop();
                tspan.text(line.join(' '));
                line = [word];
                tspan = text.append('tspan').attr('x', x).attr('y', y + lineNumber * lineHeight).attr('anchor', anchor).text(word);
            }
            word = words.pop();	
			i--;
        }
    });
}

//VDS-990: Grid formatters for Meeting details table - [START]
var gridFormatters = {
  parseSignificantProposal: function (cellvalue, options, rowObject) {
    var elementRoot = document.createElement("div");
    elementRoot.style["text-align"] = "center";
    if (cellvalue === "Yes") {
      var elementImg = document.createElement("img");
      elementImg.style["width"] = "15px";
      elementImg.setAttribute("src", "../repo/app/img/flag-filled.svg");
      elementRoot.appendChild(elementImg);
    }
    return elementRoot.outerHTML;
  },
};
//VDS-990: Grid formatters for Meeting details table - [END]

