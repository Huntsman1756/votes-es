var restConfig = {
	host: window.location.host,
	//servicePath: 'VDSDashboard/rest'
	servicePath: 'vds/api/'
};

var language = null;
function getLanguageFromUrl() {
	language =  window.location.href.split("/")[6];
  
	if (language !== 'de' && language !== 'nl' && language !== 'en' && language !== 'fr') {
	  language = 'en';
	}
   	return language;
  }
  

// VDS-995: For generating session tokens for enhancing logs in vdsApi - [START]
var loggerHelperConfig = {
	sessionToken: "",
	actionCode: 100,
	generateSessionToken: function () {
		var uniqueToken = String(Date.now());
		try {
			if (history.state === null) {
				history.pushState({ sessionToken: uniqueToken }, "");
			}
			this.sessionToken = history.state.sessionToken;
		} catch (err) {
			this.sessionToken = uniqueToken;
		}
	}
};
loggerHelperConfig.generateSessionToken();
// VDS-995: For generating session tokens for enhancing logs in vdsApi - [END]

var HTTP_STATUS_CODES = {
	'CODE_200': 'OK',
	'CODE_201': 'Created',
	'CODE_202': 'Accepted',
	'CODE_203': 'Non-Authoritative Information',
	'CODE_204': 'No Content',
	'CODE_205': 'Reset Content',
	'CODE_206': 'Partial Content',
	'CODE_300': 'Multiple Choices',
	'CODE_301': 'Moved Permanently',
	'CODE_302': 'Found',
	'CODE_303': 'See Other',
	'CODE_304': 'Not Modified',
	'CODE_305': 'Use Proxy',
	'CODE_307': 'Temporary Redirect',
	'CODE_400': 'Bad Request',
	'CODE_401': 'Unauthorized',
	'CODE_402': 'Payment Required',
	'CODE_403': 'Forbidden',
	'CODE_404': 'Not Found',
	'CODE_405': 'Method Not Allowed',
	'CODE_406': 'Not Acceptable',
	'CODE_407': 'Proxy Authentication Required',
	'CODE_408': 'Request Timeout',
	'CODE_409': 'Conflict',
	'CODE_410': 'Gone',
	'CODE_411': 'Length Required',
	'CODE_412': 'Precondition Failed',
	'CODE_413': 'Request Entity Too Large',
	'CODE_414': 'Request-URI Too Long',
	'CODE_415': 'Unsupported Media Type',
	'CODE_416': 'Requested Range Not Satisfiable',
	'CODE_417': 'Expectation Failed',
	'CODE_500': 'Internal Server Error',
	'CODE_501': 'Not Implemented',
	'CODE_502': 'Bad Gateway',
	'CODE_503': 'Service Unavailable',
	'CODE_504': 'Gateway Timeout',
	'CODE_505': 'HTTP Version Not Supported'
};

//@TODO : move this to the vdsComponents.json 
function iconImageMapping(expression) {
	var code;
	switch (expression) {
		case 'InformationTechnology':
			code = 'vds-informationtechnology';
			break;
		case 'Materials':
			code = 'vds-materials';
			break;
		case 'Utilities':
			code = 'vds-utilities';
			break;
		case 'ConsumerDiscretionary':
			code = 'vds-consumerdiscretionary';
			break;
		case 'Industrials':
			code = 'vds-industrials';
			break;
		case 'TelecommunicationServices':
			code = 'vds-telecomservices';
			break;
		case 'CommunicationServices':
			code = 'vds-comservices';
			break;
		case 'HealthCare':
			code = 'vds-healthcare';
			break;
		case 'Energy':
			code = 'vds-energy';
			break;
		case 'ConsumerStaples':
			code = 'vds-consumerstaples';
			break;
		case 'Financials':
			code = 'vds-financial';
			break;
		case 'RealEstate':
			code = 'vds-realestate';
			break;
		default:
			code = 'vds-unknown'
			break;
	}
	return code;
}

// VDS-990: Object for storing utility methods for vdsTemplates - [START]
var vdsUtility = {
  isEmpty: function (value) {
    if (typeof value === "undefined" || value == null) {
      return true;
    }
    if (vdsUtility.isString(value) && value.trim() === "") {
      return true;
    }
    return false;
  },
  isString: function (value) {
    return typeof value === "string";
  },
  getDateFromString: function (value) {
    if (!vdsUtility.isString(value) && vdsUtility.isEmpty(value)) {
      return new Date(value);
    }
    var dateProperties = value.trim().split("-");
    var year = parseInt(dateProperties[0]);
    var month = parseInt(dateProperties[1]) - 1;
    var day = parseInt(dateProperties[2]);
    return new Date(year, month, day);
  },
  getPromiseWithResolvers: function() {
	if (typeof Promise.withResolvers === 'undefined') {
	  Promise.withResolvers = function () {
	      let resolve, reject
	      const promise = new Promise((res, rej) => {
	  	  resolve = res
	  	  reject = rej
	    })
	    return { promise, resolve, reject }
	  }
	}
	return Promise.withResolvers();
  }
};
// VDS-990: Object for storing utility methods for vdsTemplates - [END]

//VDS-990: Helper object for common functionalities - [START]
var vdsAppHelper = {
  meetingDetailHeadersColumns: null,
  meetingDetailsSplitColumns: null,
  encodedClientId: null,
  getEncodedOriginUrl: function () {
    return btoa(window.location.href);
  },
  logoutUser: function () {
    var _this = vdsAppHelper;
    window.location.replace(
      window.location.origin +
        window.location.pathname +
        "logout?customerID=" +
        vdsAppHelper.encodedClientId +
        "&origin=" +
        _this.getEncodedOriginUrl()
    );
  },
  redirectToLoginPage: function (status) {
    var _this = vdsAppHelper;
    window.location.replace(
      window.location.origin +
        window.location.pathname +
        "login?customerID=" +
        vdsAppHelper.encodedClientId +
        "&origin=" +
        _this.getEncodedOriginUrl() +
        "&errorCode=" +
        status
    );
  },
  redirectToErrorPage: function (hideLoginLink) {
    var _this = vdsAppHelper;
    var redirectUrl =
      window.location.origin + window.location.pathname + "error";
    if (!hideLoginLink) {
      redirectUrl +=
        "?customerID=" +
        vdsAppHelper.encodedClientId +
        "&origin=" +
        _this.getEncodedOriginUrl();
    }
    window.location.assign(redirectUrl);
  },
  handleRedirectionForAngularJs: function (response) {
    if (
      response &&
      response.headers() &&
      response.headers("Client-Redirect") != 0
    ) {
      if (response.status === 401 || response.status === 403) {
        vdsAppHelper.redirectToLoginPage(response.status);
      } else if (response.status !== 404) {
        vdsAppHelper.redirectToErrorPage(response.headers("no-login") == 1);
      }
    }
  },
  handleRedirectionForXhr: function (xhr) {
    if (
      xhr &&
      xhr.getResponseHeader("Client-Redirect") != 0 &&
      xhr.statusText !== "abort"
    ) {
      if (xhr.status === 401 || xhr.status === 403) {
        vdsAppHelper.redirectToLoginPage(xhr.status);
      } else if (xhr.status !== 404) {
        vdsAppHelper.redirectToErrorPage(
          xhr.getResponseHeader("no-login") == 1
        );
      }
    }
  },
  vdsHeaderAjScope: null,
  vdsBodyAjScope: null,
  significantMeetingTypeID: null,
  significantDropDownValidOptions: ["Yes", "No"],
  significantValidToolBoxOptions: [3, 4],
  showCompleteAgendaDefaultAnchorText: "Show complete agenda",
  selectedSignificantOption: { sid: "All", name: "All Meetings" },
  updateMeetingListColumnArraySignificant: function (
    meetingListColumnArray,
    significantMeetingTypeID
  ) {
    var _this = vdsAppHelper;
    var indexOfSignMeeting = meetingListColumnArray.indexOf("signMeeting");
    _this.significantMeetingTypeID = significantMeetingTypeID;
    if (_this.significantMeetingTypeID === 1 && indexOfSignMeeting > -1) {
      meetingListColumnArray.splice(indexOfSignMeeting, 1);
    } else if (_this.significantMeetingTypeID === 3) {
      meetingListColumnArray[indexOfSignMeeting] = "signVote";
    } else if (_this.significantMeetingTypeID === 4) {
      meetingListColumnArray[indexOfSignMeeting] = "signMeetingVote";
    }
  },
  updateTmpSearchFilterColumnsSignificant: function (tmpSearchFilterColumns) {
    var _this = vdsAppHelper;
    if (tmpSearchFilterColumns !== null && tmpSearchFilterColumns.length) {
      tmpSearchFilterColumns = tmpSearchFilterColumns.filter(function (item) {
        return !(
          item === "significant" && _this.significantMeetingTypeID === 1
        );
      });
    }
    return tmpSearchFilterColumns;
  },
  getSignificantVoteFilterQueryParam: function () {
    var _this = vdsAppHelper;
    if (
      !(
        typeof _this.vdsBodyAjScope.significantVoteFilter === "undefined" ||
        _this.vdsBodyAjScope.significantVoteFilter === null
      )
    ) {
      return _this.vdsBodyAjScope.significantVoteFilter;
    }
    var significantFilterValue = _this.getSelectedSignificantFilterValue();
    if (significantFilterValue === null) {
      significantFilterValue = "All";
    }
    return significantFilterValue;
  },
  getSelectedSignificantFilterValue: function () {
    var _this = vdsAppHelper;
    var significantFilterValue = null;
    if (
      !(
        typeof _this.selectedSignificantOption === "undefined" ||
        _this.selectedSignificantOption === null
      )
    ) {
      significantFilterValue = _this.selectedSignificantOption.sid;
    }
    return significantFilterValue;
  },
  completeAgendaLinkVisible: function (meetingID) {
    var _this = vdsAppHelper;
    var significantFilterValue = _this.getSelectedSignificantFilterValue();
    if (
      _this.significantDropDownValidOptions.indexOf(significantFilterValue) >
        -1 &&
      _this.significantMeetingTypeID !== null &&
      _this.significantValidToolBoxOptions.indexOf(
        _this.significantMeetingTypeID
      ) > -1
    ) {
      if (_this.significantMeetingTypeID === 3) {
        return (
          _this.meetingsStore[meetingID]["SignificantMeeting"] === "Yes" &&
          _this.meetingsStore[meetingID]["AllSignProposal"] !== "Yes" &&
          _this.meetingsStore[meetingID]["HasSignProp"] === "Yes"
        );
      }
      if (_this.significantMeetingTypeID === 4) {
        return (
          _this.meetingsStore[meetingID]["SignificantMeeting"] === "Yes" &&
          _this.meetingsStore[meetingID]["IsWFTSignMeeting"] !== "Yes" &&
          _this.meetingsStore[meetingID]["AllSignProposal"] !== "Yes"
        );
      }
    }
    return false;
  },
  showOrHideCompleteAgendaLink: function (
    el,
    meetingID,
    signMeeting,
    fundInfo,
    MultipleBallotIDs,
    VoteList,
    MeetingType,
    Proponent,
    CommonCustomLanguage,
    propsalCategoryList
  ) {
    var showCompleteAgendaElement = $("#showCompleteAgenda");
    showCompleteAgendaElement.hide();
    var _this = vdsAppHelper;
    var significantFilterValue = _this.getSelectedSignificantFilterValue();
    if (_this.completeAgendaLinkVisible(meetingID)) {
      showCompleteAgendaElement.show();
      var showCompleteAgendaAnchorText =
        _this.showCompleteAgendaDefaultAnchorText;
      if (
        typeof _this.vdsBodyAjScope.significantVoteFilter === "undefined" ||
        _this.significantDropDownValidOptions.indexOf(
          _this.vdsBodyAjScope.significantVoteFilter
        ) > -1
      ) {
        _this.vdsBodyAjScope.significantVoteFilter = significantFilterValue;
      } else {
        _this.vdsBodyAjScope.significantVoteFilter = "All";
        showCompleteAgendaAnchorText = "Show filtered agenda";
      }
      showCompleteAgendaAnchorElement = showCompleteAgendaElement.find("a");
      showCompleteAgendaAnchorElement.text(
        _this.getLangProperty(showCompleteAgendaAnchorText)
      );
      showCompleteAgendaAnchorElement.off("click").on("click", function () {
        if (_this.vdsBodyAjScope.significantVoteFilter === "All") {
          _this.vdsBodyAjScope.significantVoteFilter = significantFilterValue;
        } else {
          _this.vdsBodyAjScope.significantVoteFilter = "All";
        }
        showMeetingDetail(
          el,
          meetingID,
          signMeeting,
          fundInfo,
          MultipleBallotIDs,
          VoteList,
          MeetingType,
          Proponent,
          CommonCustomLanguage,
          propsalCategoryList
        );
      });
    }
  },
  meetingsStore: null,
  vdsServices: null,
  // VDS-1626: Function to get the current execution stack trace.
  getCurrStackTrace() {
	let currStackTrace;
	try {
	  currStackTrace = (new Error()).stack;
	} catch(err) {
	  currStackTrace = "";
      console.error(err);
	}
	return currStackTrace;
  },
  meetingDetailsUniqueColumns: null,
  //VDS-1391 - Get the cusip, isin list and form dropdown [START]
  createSecurityListDropdown: function(meetingID) {
	var _this = vdsAppHelper;
	// VDS-1626: Check whether the function was called from the security list drop-down, or meeting listing.
	const currStackTrace = _this.getCurrStackTrace();
	if(!(currStackTrace.indexOf("showMeetingDetailFromCache") > -1)) {
	  selectedSecurityId = null;
	}
	$(".npxDatapoints").show();
    var cusipIsinPairs = [];
    var meeting = vdsAppHelper.meetingsStore[meetingID];
    		
    var cusips = meeting.Cusips ? meeting.Cusips.split(",").map(cusip=>cusip.trim()) : [];
    var isins = meeting.Isins ? meeting.Isins.split(",").map(isin=>isin.trim()) : [];
     
    // If CUSIP is null, keep only ISIN
    if (cusips.length === 0) {
    	cusips.push(null);
    }
    
    // If ISIN is null, keep only CUSIP
    if (isins.length === 0) {
    	isins.push(null);
    }
    
    if(vdsAppHelper.meetingDetailHeadersColumns.includes('cusip') || vdsAppHelper.meetingDetailHeadersColumns.includes('isin')){
    	$('.showSecurityID').hide();
    }
    
    for(var i=0; i<cusips.length; i++){
    	const securityOptions = {};
    	if(vdsAppHelper.meetingDetailHeadersColumns.includes('cusip') && !vdsUtility.isEmpty(cusips[i])){
    		securityOptions["cusip"] = cusips[i];
    	}
    	if(vdsAppHelper.meetingDetailHeadersColumns.includes('isin') && !vdsUtility.isEmpty(isins[i])){
    		securityOptions["isin"] =  isins[i];
    	}
    	if(!vdsUtility.isEmpty(cusips[i]) || !vdsUtility.isEmpty(isins[i])){
    		cusipIsinPairs.push(securityOptions);
    	}
    }
      
    //Security list dropdown creation
	if(document.getElementById("cusipisindropdown") !== null){  //VDS-1391 this if condition can be removed once all clients are compatible
    	var selectDropdown = document.getElementById("cusipisindropdown");
    	selectDropdown.innerHTML = "";

		// Create the default "All" option
    	var defaultOption = document.createElement("option");
    	defaultOption.text = "All";
    	defaultOption.value = "All";  // You can set a specific value if needed, for now it's set to an empty string
		
    	// Append the default "All" option to the dropdown
    	selectDropdown.appendChild(defaultOption);
		
    	// Iterate through the cusipIsinPairs array and create options
    	cusipIsinPairs.forEach(function(pair, index) {
    		var option = document.createElement("option");
    		option.text = [
    			pair.cusip 
    			, pair.isin
    		]
    		.join(",");
    		option.value = option.text;

			option.text = option.text.replace(/^,|,$/g,'');
		
    		if(index===0 && vdsUtility.isEmpty(selectedSecurityId)) {
    			selectedSecurityId = option.value;
    		}
		    
    		if(option.text != '')
    		{
    			selectDropdown.appendChild(option);
    		}
    	});
	
    	//sets the value of the dropdown element with the id cusipisindropdown to the valuestored in the variable selectedSecurityId
    	$("#cusipisindropdown").val(selectedSecurityId);

    	$('.securityListDropdown').show(); //show dropdown whenever a new meeting is loaded to clear the hidden attribute

    	//hide cusip/isin dropdown if no cusip,isin values are present, only one pair is present or it is notsubscribed
    	if(cusipIsinPairs.length<=1 ||
			(!vdsAppHelper.meetingDetailHeadersColumns.includes('cusip') && 
			!vdsAppHelper.meetingDetailHeadersColumns.includes('isin'))){
    		$('.securityListDropdown').hide();
    	}
	
    	// Add onchange event handler
    	selectDropdown.onchange = showMeetingDetailFromCache;
    }
},
//VDS-1391 - Get the cusip, isin list and form dropdown [END]

//VDS-1391 - Get the Vote column with shares voted for each vote [START]
    processVoteSharesVotedDetail: function(rowObject, passLanguage = {}) {
		if(vdsAppHelper.meetingDetailsSplitColumns.includes("votesharesvoted")
			&& rowObject.VoteSharesVotedDetail != null){
            var voteDetail = rowObject.VoteSharesVotedDetail;
            var voteDetailArr = voteDetail.split(',');
            var finalResult = [];
            var futureVotesString = false; // Initialize futureVotesString
        
            // Extracting vote types before first '(' and joining with data from '(' to ')'
            $.each(voteDetailArr, function(index, value) {
                var splitIndex = value.indexOf('(');
                var voteType, voteData;
        
                if (splitIndex !== -1) {
                    voteType = value.substring(0, splitIndex).trim();
                    voteData = value.substring(splitIndex); // Extracting data from '(' to ')'
                } else {
                    voteType = value.trim(); // If no '(' is found, assume the whole string is the vote type
                    voteData = '';
                }
        
                // Check if '*' is present in the value
                if (value.includes('*')) {
                    futureVotesString = true;
                    $("#futureMeetingText").show();
                }
        
                var cleanedVoteType = voteType.replace(/&nbsp;/g, '').replace(/&ensp;/g, '');
                var translatedVoteType = passLanguage[cleanedVoteType] !== undefined ? passLanguage    [cleanedVoteType] : cleanedVoteType;
        
                finalResult.push(translatedVoteType + voteData); // Pushing vote type with data or just the     vote type
            });
        
            // Joining the finalResult array with ',<br>' after every element
            return finalResult.join(',<br>');
        }
	    return null;
    },


//VDS-1391 - Get the Vote column with shares voted for each vote [END]

  getMeetingDetailsUniqueColumnsForExport: function () {
    var _this = vdsAppHelper;
    if (_this.meetingDetailsUniqueColumns !== null) {
      return _this.meetingDetailsUniqueColumns;
    }
    var meetingDetailsPipedColumns =
      _this.vdsBodyAjScope.customerPreference.MeetingListColumns +
      "|" +
      _this.vdsBodyAjScope.commonDashboardProperties
        .MandatoryColumnsMeetingDetailExport +
      "|" +
      _this.vdsServices.getMeetingDetailColumns();
    var meetingDetailsColumns = meetingDetailsPipedColumns.split("|");

    var displayNotesTypeID =
      _this.vdsBodyAjScope.customerPreference.DisplayNotesTypeID;
    if (displayNotesTypeID === 1) {
      meetingDetailsColumns.push("notes");
    } else if (displayNotesTypeID === 2) {
      meetingDetailsColumns.push("researchNotes");
    } else if (displayNotesTypeID === 3) {
      meetingDetailsColumns.push("notes");
      meetingDetailsColumns.push("researchNotes");
    } else if (displayNotesTypeID === 4) {
      meetingDetailsColumns.push("blendedRationale");
    } else if (displayNotesTypeID === 5) {
      meetingDetailsColumns.push("contextualNotes");
    }

    var meetingDetailsHashTable = {};
    _this.meetingDetailsUniqueColumns = meetingDetailsColumns.filter(function (
      item
    ) {
      if (!(item in meetingDetailsHashTable)) {
        meetingDetailsHashTable[item] = null;
        return true;
      }
      return false;
    });

    if (_this.meetingDetailsUniqueColumns.indexOf("proposalCategory") > -1) {
      _this.meetingDetailsUniqueColumns.push("proposalSubcategory");
    }

    //VDS-990: Conditions to include/exclude/rename significant meeting/vote - [START]
    var indexOfSignificantVote =
      _this.meetingDetailsUniqueColumns.indexOf("significantVote");
    if (
      (indexOfSignificantVote > -1 && _this,
      this.vdsBodyAjScope.customerPreference.SignificantMeetingTypeID === 1)
    ) {
      _this.meetingDetailsUniqueColumns.splice(indexOfSignificantVote, 1);
    }
    //VDS-990: Conditions to include/exclude/rename significant meeting/vote - [END]

    return _this.meetingDetailsUniqueColumns;
  },
  getLangProperty: function (key, strictCheck) {
    if (typeof strictCheck === "undefined") {
      strictCheck = false;
    }
    var _this = vdsAppHelper;
    if (typeof _this.vdsServices === "undefined") {
      return key;
    }
    var returnVal = _this.vdsServices.getPreferLanguageProperties()[key];
    if (typeof returnVal === "undefined" && !strictCheck) {
      return key;
    }
    return returnVal;
  },
  reversedLanguageProperties: null,
  getReversedLanguageProperties: function () {
    var _this = vdsAppHelper;
    if (_this.reversedLanguageProperties === null) {
      _this.reversedLanguageProperties = {};
      Object.entries(_this.vdsServices.getPreferLanguageProperties()).forEach(
        function (ele) {
          if (!(Array.isArray(ele) && ele.length === 2)) {
            return;
          }
          _this.reversedLanguageProperties[ele[1]] = ele[0];
        }
      );
    }
    return _this.reversedLanguageProperties;
  },
  getLangPropertyKey: function (value, strictCheck) {
    if (typeof strictCheck === "undefined") {
      strictCheck = false;
    }
    var _this = vdsAppHelper;
    if (typeof _this.vdsServices === "undefined") {
      return value;
    }
    var returnKey = _this.getReversedLanguageProperties()[value];
    if (typeof returnKey === "undefined" && !strictCheck) {
      return value;
    }
    return returnKey;
  },
  meetingDetailColumnMappings: {
    proponent: "shareholderproposal",
    esg: "esgpillar",
    rec: "mgtrecvote",
    significantvote: "significantproposalyn",
    vote: "clientvotelist",
    proposalcategory: "proposalcategory",
    item: "ballotitemnumber",
    proposal: "proposal",
	npxsecproposalcategory:"npxsecproposalcategory",
	sharesvoted:"sharesvoted",
  },
  processMeetingDetailColumnPreferences: function (colModelMeetingDetails) {
    if (
      typeof colModelMeetingDetails === "undefined" ||
      colModelMeetingDetails === null ||
      colModelMeetingDetails.length === 0
    ) {
      return;
    }
    var _this = vdsAppHelper;
    var meetingDetailColumnsDelimited =
      _this.vdsServices.getMeetingDetailColumns();
    if (
      typeof meetingDetailColumnsDelimited === "undefined" ||
      meetingDetailColumnsDelimited === null
    ) {
      return;
    }
	//VDS-1391 Update the Vote column as per the votesharesvoted subscription [START]
	if(vdsAppHelper.meetingDetailsSplitColumns.includes("votesharesvoted") && colNamesMeetingDetail.includes("Vote")){
		let voteIndex = colNamesMeetingDetail.indexOf("Vote");
		colNamesMeetingDetail[voteIndex] = "Vote(Shares Voted | Mgmt Alignment)";
	}
	//VDS-1391 Update the Vote column as per the votesharesvoted subscription [END]
    var meetingDetailColumns = meetingDetailColumnsDelimited
      .split("|")
      .map(function (meetingDetailColumn) {
        return _this
          .meetingDetailColumnMappings[meetingDetailColumn.trim().toLowerCase()];
      });
    colModelMeetingDetails.forEach(function (colModelMeetingDetail) {
      try {
        var colModelMeetingDetailName =
          colModelMeetingDetail["name"].toLowerCase();
        var colModelMeetingDetailIndex =
          colModelMeetingDetail["index"].toLowerCase();
        if (
          colModelMeetingDetailName === "significantproposalyn" ||
          colModelMeetingDetailIndex === "significantproposalyn"
        ) {
          return;
        }
        if (
          meetingDetailColumns.indexOf(colModelMeetingDetailName) > -1 ||
          meetingDetailColumns.indexOf(colModelMeetingDetailIndex) > -1
        ) {
          colModelMeetingDetail["hidden"] = false;
        } else {
          colModelMeetingDetail["hidden"] = true;
        }
      } catch (err) {
        console.error(err);
      }
    });
  },

  //VDS-1391 - check for meeting detail header preferences [START]
  //Handle meeting detail header configs with db
  meetingDetailHeaderMappings: {
    cusip: "cusipdetail",
	isin:"isindetail",
	sharesonloan:"sharesonloandetail",
  },
  processMeetingDetailHeaderPreferences: function (colModelMeetingDetails) {
    if (
      typeof colModelMeetingDetails === "undefined" ||
      colModelMeetingDetails === null ||
      colModelMeetingDetails.length === 0
    ) {
      return;
    }
    var _this = vdsAppHelper;
    var meetingDetailHeadersDelimited =
      _this.vdsServices.getMeetingDetailHeaders();
    if (
      typeof meetingDetailHeadersDelimited === "undefined" ||
      meetingDetailHeadersDelimited === null
    ) {
      return;
    }
    var meetingDetailHeaders = meetingDetailHeadersDelimited
      .split("|")
      .map(function (meetingDetailHeader) {
        return _this
          .meetingDetailHeaderMappings[meetingDetailHeader.trim().toLowerCase()];
      });
    colModelMeetingDetails.forEach(function (colModelMeetingDetail) {
    if(colModelMeetingDetail["isMeetingLevel"]=== "Yes"){
        try {
          var colModelMeetingDetailName =
            colModelMeetingDetail["name"].toLowerCase();
          var colModelMeetingDetailIndex =
            colModelMeetingDetail["index"].toLowerCase();
          if (
              (
			        meetingDetailHeaders.indexOf(colModelMeetingDetailName) > -1 ||
			        meetingDetailHeaders.indexOf(colModelMeetingDetailIndex) > -1
			   )
          ) {
            $("."+colModelMeetingDetail["displayClass"]).show();
          } 
        } catch (err) {
          console.error(err);
        }
	}
    });
  },
  //VDS-1391 - check for meeting detail header preferences [END]

  graphIdMappings: {
    4: "vds/api/getVdsData/8?",
    5: "vds/api/getVdsData/9?",
    6: "vds/api/getVdsData/10?",
    7: "vds/api/getVdsData/11?",
    9: "vds/api/getVdsData/12?",
    10: "vds/api/getVotesCastByProposalCategory?voteCastProposalGraph=1&",
    11: "vds/api/getVotesCastByProposalCategory?voteCastProposalGraph=0&",
  },
  graphApiCallSequence: ["4", "5", "6", "7", "9", "10", "11"],
  fetchGraphResponse($http, srchStr) {
    // Helper method to return all entitled promises for Graph APIs
    var _this = vdsAppHelper;
    var graphIds =
      _this.vdsBodyAjScope.customerPreference.GraphicalMetrics.split("|");
    return _this.graphApiCallSequence.map(function (graphId) {
      if (graphIds.indexOf(graphId) > -1 || graphId === "4") {
        return $http({
          method: "GET",
          url:
            _this.vdsServices.getBaseURL() +
            _this.graphIdMappings[graphId] +
            srchStr,
          cache: "true",
        });
      }
      return null;
    });
  },
  updateCustomerPreferences: function (customerPreferences) {
    if (vdsUtility.isEmpty(customerPreferences)) {
      return;
    }
    if (!customerPreferences.ShowTable) {
      customerPreferences.EnableMeetingListDownload = false;
      customerPreferences.EnableMeetingDetailDownload = false;
      customerPreferences.StagingEnableMeetingListDownload = false;
      customerPreferences.StagingEnableMeetingDetailDownload = false;
    }
	if(!customerPreferences.EnableAuth) {
	  customerPreferences.StagingEnableMeetingListDownload = customerPreferences.EnableMeetingListDownload;
	  customerPreferences.StagingEnableMeetingDetailDownload = customerPreferences.EnableMeetingDetailDownload;
	  customerPreferences.StagingIncludePrintCSS = customerPreferences.IncludePrintCSS;
	}
  },
  addPageBreaksForPrint: function () {
    try {
      var _this = vdsAppHelper;
      var addPageBreakBefore =
        _this.vdsBodyAjScope.customerPreference.IncludeHeader ||
        _this.vdsBodyAjScope.customerPreference.IncludeLogo ||
        _this.vdsBodyAjScope.customerPreference.Includepolicysection ||
        _this.vdsBodyAjScope.customerPreference.AppliedFilterText;
      if (
        !(
          $("#tilesDiv").find("vds-vote-cast-proposal").index() === 0 &&
          !addPageBreakBefore
        )
      ) {
        $("#tilesDiv")
          .find("vds-vote-cast-proposal")
          .before("<div class='page-break-before'></div>");
      }
      if (
        !(
          $("#tilesDiv")
            .find("vds-alignment-mgmt-proposal-category")
            .index() === 0 && !addPageBreakBefore
        )
      ) {
        $("#tilesDiv")
          .find("vds-alignment-mgmt-proposal-category")
          .before("<div class='page-break-before'></div>");
      }
      $("vds-vote-cast-proposal, vds-alignment-mgmt-proposal-category").after(
        "<div class='page-break-after'></div>"
      );
    } catch (err) {
      console.log(err);
    }
  },
};
//VDS-990: Helper object for common functionalities - [END]

var routeManager = {
  rootUrl: null,
  customersUrl: null,
  getRootUrl() {
    var _this = routeManager;
    if (_this.rootUrl === null) {
      _this.rootUrl = window.location.origin + "/vds/";
    }
    return _this.rootUrl;
  },
  getCustomersUrl() {
    var _this = routeManager;
    if (_this.customersUrl === null) {
      _this.customersUrl = _this.getRootUrl() + "customers";
    }
    return _this.customersUrl;
  },
  routeToCustomersUrl() {
    var _this = routeManager;
    window.location.replace(_this.getCustomersUrl());
  },
  routeBasedOnCurrentUrl() {
    var _this = routeManager;
    if (vdsUtility.isEmpty(window.location.hash)) {
      _this.routeToCustomersUrl();
	  return;
    }
  },
};

routeManager.routeBasedOnCurrentUrl();

// VDS-990: Helper object to process server's response for graphs - [START]
var graphResponseParser = {
  vdsServices: null,
  votesCastByProposalCategoryGraph: {
    managementMax: "",
    managementMaxValue: 0,
    shareholderMax: "",
    shareholderMaxValue: 0,
    processedResponse: {
      Management: {},
      Shareholder: {},
      otherData: [{}],
    },
    processResponse: function (response) {
      var _this = graphResponseParser.votesCastByProposalCategoryGraph;
      _this.resetState();
      response.forEach(function (item, index) {
        if (item.OutputType === "votingCastProposalCategory") {
          _this.processRecord(item, index);
        }
      });
      graphResponseParser.vdsServices.setvotingCastProposalCategory(
        _this.processedResponse
      );
    },
    resetState: function () {
      var _this = graphResponseParser.votesCastByProposalCategoryGraph;
      _this.managementMax = "";
      _this.managementMaxValue = 0;
      _this.shareholderMax = "";
      _this.shareholderMaxValue = 0;
      _this.processedResponse = {
        Management: {},
        Shareholder: {},
        otherData: [{}],
      };
    },
    getLabels: function () {
      return [
        "",
        "",
        {
          role: "tooltip",
          p: {
            html: true,
          },
        },
        "",
        {
          role: "style",
        },
        "",
      ];
    },
    processRecord: function (item, index) {
      var _this = graphResponseParser.votesCastByProposalCategoryGraph;
      if (index === 0) {
        _this.processedResponse.Management.chartData = [_this.getLabels()];
        _this.processedResponse.Shareholder.chartData = [_this.getLabels()];
      }
      if (
        item.ProposalText !== "Total Management Votes" &&
        item.ProposalText !== "Total Shareholder Votes"
      ) {
        if (item.ProposalCategory === "Shareholder") {
          _this.processedResponse.Shareholder.chartData.push([
            item.ProposalText,
            item.TotalVotes,
            "",
            item.ProposalText,
          ]);
          if (_this.shareholderMax === "") {
            _this.shareholderMax = item.ProposalText;
            _this.shareholderMaxValue = parseInt(item.TotalVotes);
          } else if (_this.shareholderMaxValue < parseInt(item.TotalVotes)) {
            _this.shareholderMax = item.ProposalText;
            _this.shareholderMaxValue = parseInt(item.TotalVotes);
          }
        } else if (item.ProposalCategory === "Management") {
          _this.processedResponse.Management.chartData.push([
            item.ProposalText,
            item.TotalVotes,
            "",
            item.ProposalText,
          ]);
          if (_this.managementMax === "") {
            _this.managementMax = item.ProposalText;
            _this.managementMaxValue = parseInt(item.TotalVotes);
          } else if (_this.managementMaxValue < parseInt(item.TotalVotes)) {
            _this.managementMax = item.ProposalText;
            _this.managementMaxValue = parseInt(item.TotalVotes);
          }
        }
      } else if (item.ProposalText === "Total Management Votes") {
        _this.processedResponse.otherData[0].ManagementVotes = parseInt(
          item.TotalVotes
        );
        _this.processedResponse.otherData[0].ManagementMax =
          _this.managementMax;
      } else if (item.ProposalText === "Total Shareholder Votes") {
        _this.processedResponse.otherData[0].ShareholderVotes = parseInt(
          item.TotalVotes
        );
        _this.processedResponse.otherData[0].shareHolderMax =
          _this.shareholderMax;
      }
    },
  },
  votingCastAlignMgmtProposalCategory: {
    managementMax: "",
    managementMaxValue: 0,
    shareholderMax: "",
    shareholderMaxValue: 0,
    processedResponse: {
      Management: {},
      Shareholder: {},
      otherData: [{}],
    },
    processResponse: function (response) {
      var _this = graphResponseParser.votingCastAlignMgmtProposalCategory;
      _this.resetState();
      response.forEach(function (item, index) {
        if (item.OutputType === "votingCastProposalCategory") {
          _this.processRecord(item, index);
        }
      });
      graphResponseParser.vdsServices.setvotingCastAlignMgmtProposalCategory(
        _this.processedResponse
      );
    },
    resetState: function () {
      var _this = graphResponseParser.votingCastAlignMgmtProposalCategory;
      _this.managementMax = "";
      _this.managementMaxValue = 0;
      _this.shareholderMax = "";
      _this.shareholderMaxValue = 0;
      _this.processedResponse = {
        Management: {},
        Shareholder: {},
        otherData: [{}],
      };
    },
    getLabels: function () {
      return [
        "",
        vdsAppHelper.getLangProperty("Voted With Management"),
        {
          role: "tooltip",
          p: {
            html: true,
          },
        },
        vdsAppHelper.getLangProperty("Voted Against Management"),
        {
          role: "tooltip",
          p: {
            html: true,
          },
        },
        "",
        {
          role: "style",
        },
        "",
      ];
    },
    processRecord: function (item, index) {
      var _this = graphResponseParser.votingCastAlignMgmtProposalCategory;
      if (index === 0) {
        _this.processedResponse.Management.chartData = [_this.getLabels()];
        _this.processedResponse.Shareholder.chartData = [_this.getLabels()];
      }

      if (item.ProposalText === "Unique Meetings Voted count") {
        _this.processedResponse.otherData[0].uniqueMeetingsVoted = parseInt(
          item.TotalVotes
        );
      } else if (
        item.ProposalText ===
        "Management Unique Meetings Voted Against Management count"
      ) {
        _this.processedResponse.otherData[0].uniqueMeetingsVotedManagement =
          parseInt(item.TotalVotes);
      } else if (
        item.ProposalText ===
        "Shareholder Unique Meetings Voted Against Management count"
      ) {
        _this.processedResponse.otherData[0].uniqueMeetingsVotedShareholder =
          parseInt(item.TotalVotes);
      } else if (
        item.ProposalText !== "Total Management Votes" &&
        item.ProposalText !== "Total Shareholder Votes"
      ) {
        if (item.ProposalCategory === "Shareholder") {
          _this.processedResponse.Shareholder.chartData.push([
            item.ProposalText,
            item.TotalVoteWithFlag,
            "",
            item.TotalVoteAgainstFlag,
            "",
            item.ProposalText,
          ]);
          if (_this.shareholderMax === "") {
            _this.shareholderMax = item.ProposalText;
            _this.shareholderMaxValue = parseInt(item.TotalVoteAgainstFlag);
          } else if (
            _this.shareholderMaxValue < parseInt(item.TotalVoteAgainstFlag)
          ) {
            _this.shareholderMax = item.ProposalText;
            _this.shareholderMaxValue = parseInt(item.TotalVoteAgainstFlag);
          }
        } else if (item.ProposalCategory === "Management") {
          _this.processedResponse.Management.chartData.push([
            item.ProposalText,
            item.TotalVoteWithFlag,
            "",
            item.TotalVoteAgainstFlag,
            "",
            item.ProposalText,
          ]);
          if (_this.managementMax === "") {
            _this.managementMax = item.ProposalText;
            _this.managementMaxValue = parseInt(item.TotalVoteAgainstFlag);
          } else if (
            _this.managementMaxValue < parseInt(item.TotalVoteAgainstFlag)
          ) {
            _this.managementMax = item.ProposalText;
            _this.managementMaxValue = parseInt(item.TotalVoteAgainstFlag);
          }
        }
      } else if (item.ProposalText === "Total Management Votes") {
        _this.processedResponse.otherData[0].ManagementVotes = parseInt(
          item.TotalVotes
        );
        _this.processedResponse.otherData[0].ManagementMax =
          _this.managementMax;
      } else if (item.ProposalText === "Total Shareholder Votes") {
        _this.processedResponse.otherData[0].ShareholderVotes = parseInt(
          item.TotalVotes
        );
        _this.processedResponse.otherData[0].shareHolderMax =
          _this.shareholderMax;
      }
    },
  },
  clearReferences: function () {
    var _this = graphResponseParser;
    _this.vdsServices = null;
  },
};
// VDS-990: Helper object to process server's response for graphs - [END]

/*function compare(a,b) {
  if (a.value < b.value)
    return 1;
  if (a.value > b.value)
    return -1;
  return 0;
}*/

/*function compare1(a,b) {
	  if (parseInt(a.MeetingCount) < parseInt(b.MeetingCount))
	    return 1;
	  if (parseInt(a.MeetingCount) > parseInt(b.MeetingCount))
	    return -1;
	  return 0;
	}*/


function propComparator(prop) {
	return function (a, b) {
		if (parseInt(a[prop]) < parseInt(b[prop]))
			return 1;
		if (parseInt(a[prop]) > parseInt(b[prop]))
			return -1;
		return 0;
	}
}

function percentageRounding(percentTotal, adjustmentObj) {
	percentTotal = parseFloat(percentTotal);
	//adjustmentObj = decimalPlaces(parseFloat(adjustmentObj),1);
	adjustmentObj = parseFloat(adjustmentObj);
	//console.log(adjustmentObj)

	return percentTotal > 100 ? decimalPlaces((adjustmentObj - Math.round(percentTotal - 100)), 1) : percentTotal == 100 ? decimalPlaces(adjustmentObj, 1) : decimalPlaces((adjustmentObj + Math.round((100 - percentTotal) * 100) / 100), 1);
}

function clearGraphMeetingList(el, whichDiv, whichImg, flag, selectedGraph) {
	var $scope = angular.element(el).scope();
	showHideMeetingList($scope, whichDiv, whichImg, flag);
	$scope.$apply(function() {
		loggerHelperConfig.actionCode = 120;
		$scope.$parent.$parent.getMeetingList();
		$scope.$parent.$parent[selectedGraph].name = '';
		$scope.$parent.$parent[selectedGraph].clear = false;
		$('.' + selectedGraph).css('display', 'none');
		loggerHelperConfig.actionCode = 100;
	});
}

function clearRemainingGraphselected(el, selectedGraph) {
	//console.log(el);
	var $scope = el;

	var glist = ["selectedStatisticsGraphList", "selectedManagementGraphList", "selectedProposalGraphList", "selectedMarketGraphList",
		"selectedMeetingTypeGraphList", "selectedSectorGraphList", "selectedAlignMgmtProposalGraphList"];
	glist.forEach(function(item) {
		if (item !== selectedGraph) {
			$scope.$apply(function() {
				if($scope.$parent[item] !== undefined && $scope.$parent[item] !== null){
					$scope.$parent[item].name = '';
					$scope.$parent[item].clear = false;
					$('.' + item).css('display', 'none');
				}
			});
		}

	});
}

function showHideMeetingList(el, whichDiv, whichImg, flag) {
	selectedSecurityId = null;

	
	/*
	Flag 1 ==== LoadMeetingListUnderGraph Call
	Flag 2 ==== Normal Call
	*/

	var flag = flag;                
	if (flag == undefined) {                        // For Old calls which do not Have flag variable been passed. Please make this change to all showhide calls as and when client update comes.
		flag = 2;
	}
	var exp_coll = "";
	var change = document.getElementById(whichImg);

	if (flag == 1) {

		var $scope = el;
		var custID = $scope.CustomerId;

	}
	else {
		var $scope = angular.element(el).scope();
		var custID = $scope.custID;

	}

	//var custID = 3541;
	var ExpandButtonText = $scope.ExpandButtonText;
	var CollapseButtonText = $scope.CollapseButtonText;
	var newExpandButtonFormat = $scope.newExpandButtonFormat;
	
	$("#meetingDisplayGrid").appendTo("#" + whichDiv);
	var outerwidth = $('#' + whichDiv).width();

	$("#meetingDisplayGrid").width(outerwidth + 4);
	$("#meetingListGrid").hide();

	if (newExpandButtonFormat == 'true') {

		exp_coll = document.getElementsByClassName('expandClass');

		if (document.getElementById(whichImg).innerHTML.indexOf(CollapseButtonText) != -1) {
			$("#meetingDisplayGrid").hide('500');
			change.innerHTML = "<span class='glyphicon glyphicon-plus'></span> " + ExpandButtonText + "";
			$("#" + whichDiv + "_header").css("display", "none");
			document.getElementById(whichImg).src = '/repo/' + custID + '/img/expand.png';

		}

		else if (document.getElementById(whichImg).innerHTML.indexOf(ExpandButtonText) != -1) {
			$("#meetingDisplayGrid").hide();	//force hide, so that animation triggers before 'show' :-)
			$("#meetingDisplayGrid").show('500');

			$("#" + whichDiv + "_header").css("display", "block");
			change.innerHTML = "<span class='glyphicon glyphicon-minus'></span> " + CollapseButtonText + "";


		}

	}

	else {

		exp_coll = document.getElementsByClassName('expand_Collapse');
		
		if (document.getElementById(whichImg).src.indexOf("collapse.png") != -1) {
			$("#meetingDisplayGrid").hide('500');
			document.getElementById(whichImg).src = '/repo/' + custID + '/img/expand.png';
		
		}
		else if (document.getElementById(whichImg).src.indexOf("expand.png") != -1) {
			$("#meetingDisplayGrid").hide();	//force hide, so that animation triggers before 'show' :-)
			$("#meetingDisplayGrid").show('500');
			document.getElementById(whichImg).src = '/repo/' + custID + '/img/collapse.png';
		
		}
	}


	
	for (var i = 0; i < exp_coll.length; ++i) {
		var item = exp_coll[i];

		if (item.id != whichImg) {
			if (newExpandButtonFormat == 'true') {
				document.getElementById(item.id).innerHTML = "<span class='glyphicon glyphicon-plus'></span> " + ExpandButtonText + "";
				$("#" + item.id + "_header").css("display", "none");
			}
			else {
				item.src = '/repo/' + custID + '/img/expand.png';
			}
		}
	}

	var header_count = document.getElementsByClassName('meetingListHeaders');
	for (var i = 0; i < header_count.length; ++i) {
		var item = header_count[i];

		if (item.id != whichDiv + '_header') {
			item.style = 'display:none;';
		}

	}

	$('#meetingDisplayGrid').width($('#meetingDisplayGrid').parent().width() + 1);

	var outerwidth = $('#meetingDisplayGrid').width();
	$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically			
	$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width() + 1);

	if (document.getElementById(whichImg).innerHTML.indexOf(CollapseButtonText) != -1 || document.getElementById(whichImg).src.indexOf("collapse.png") != -1)	//animate only when expand is clicked
	{
		setTimeout(function () {
			if ($('#mynav').hasClass("navbar-static-top") == true) {
				$("html, body").animate({ scrollTop: $("#meetingDisplayGrid").offset().top - 200 }, 500);
			}
			else {
				$("html, body").animate({ scrollTop: $("#meetingDisplayGrid").offset().top - 100 }, 500);
			}

		}, 200);
	}


	//$(window).resize();			
}

/**changes by mayank */
function showHideMeetingListByCriteria(el, whichDiv, whichImg, flag) {
	var flag = flag;
	if (flag == undefined) {                        // For Old calls which do not Have flag variable been passed. Please make this change to all showhide calls as and when client update comes.
		flag = 2;
	}
	var exp_coll = "";
	var change = document.getElementById(whichImg);

	if (flag == 1) {

		var $scope = el;
		var custID = $scope.CustomerId;

	}
	else {
		var $scope = angular.element(el).scope();
		var custID = $scope.custID;

	}

	//var custID = 3541;
	var ExpandButtonText = $scope.ExpandButtonText;
	var CollapseButtonText = $scope.CollapseButtonText;
	var newExpandButtonFormat = $scope.newExpandButtonFormat;

	$("#meetingDisplayGrid").appendTo("#" + whichDiv);
	var outerwidth = $('#' + whichDiv).width();

	$("#meetingDisplayGrid").width(outerwidth + 4);
	$("#meetingListGrid").hide();
	if (newExpandButtonFormat == 'true') {

		exp_coll = document.getElementsByClassName('expandClass');

		/*if (document.getElementById(whichImg).innerHTML.indexOf(CollapseButtonText) != -1) {
			$("#meetingDisplayGrid").hide('500');
			change.innerHTML = "<span class='glyphicon glyphicon-plus'></span> " + ExpandButtonText + "";
			$("#" + whichDiv + "_header").css("display", "none");
			document.getElementById(whichImg).src = '/repo/' + custID + '/img/expand.png';

		}*/

		/*if (document.getElementById(whichImg).innerHTML.indexOf(ExpandButtonText) != -1) {*/
		//$("#meetingDisplayGrid").hide();	//force hide, so that animation triggers before 'show' :-)
		$("#meetingDisplayGrid").show('500');

		$("#" + whichDiv + "_header").css("display", "block");
		change.innerHTML = "<span class='glyphicon glyphicon-minus'></span> " + CollapseButtonText + "";


		/*}*/

	}

	else {

		exp_coll = document.getElementsByClassName('expand_Collapse');

		if (document.getElementById(whichImg).src.indexOf("collapse.png") != -1) {
			$("#meetingDisplayGrid").hide('500');
			//$("#export").hide();
			document.getElementById(whichImg).src = '/repo/' + custID + '/img/expand.png';

		}
		else if (document.getElementById(whichImg).src.indexOf("expand.png") != -1) {
			$("#meetingDisplayGrid").hide();	//force hide, so that animation triggers before 'show' :-)
			$("#meetingDisplayGrid").show('500');
			//$("#export").show();
			document.getElementById(whichImg).src = '/repo/' + custID + '/img/collapse.png';

		}
	}



	for (var i = 0; i < exp_coll.length; ++i) {
		var item = exp_coll[i];

		if (item.id != whichImg) {
			if (newExpandButtonFormat == 'true') {
				document.getElementById(item.id).innerHTML = "<span class='glyphicon glyphicon-plus'></span> " + ExpandButtonText + "";
				$("#" + item.id + "_header").css("display", "none");
			}
			else {
				item.src = '/repo/' + custID + '/img/expand.png';
			}
		}
	}

	var header_count = document.getElementsByClassName('meetingListHeaders');
	for (var i = 0; i < header_count.length; ++i) {
		var item = header_count[i];

		if (item.id != whichDiv + '_header') {
			item.style = 'display:none;';
		}

	}

	$('#meetingDisplayGrid').width($('#meetingDisplayGrid').parent().width() + 1);

	var outerwidth = $('#meetingDisplayGrid').width();
	$('#list').setGridWidth(outerwidth); // setGridWidth method sets a new width to the grid dynamically			
	$("#list").closest('.ui-jqgrid-bdiv').width($("#list").closest('.ui-jqgrid-bdiv').width() + 1);

	if (document.getElementById(whichImg).innerHTML.indexOf(CollapseButtonText) != -1 || document.getElementById(whichImg).src.indexOf("collapse.png") != -1)	//animate only when expand is clicked
	{
		setTimeout(function() {
			if ($('#mynav').hasClass("navbar-static-top") == true) {
				$("html, body").animate({ scrollTop: $("#meetingDisplayGrid").offset().top - 200 }, 500);
			}
			else {
				$("html, body").animate({ scrollTop: $("#meetingDisplayGrid").offset().top - 100 }, 500);
			}

		}, 200);
	}

}





function decimalPlaces(float, length) {
	ret = "";
	str = float.toString();
	array = str.split(".");
	if (array.length == 2) {
		ret += array[0] + ".";
		for (i = 0; i < length; i++) {
			if (i >= array[1].length) ret += '0';
			else ret += array[1][i];
		}
	}
	else if (array.length == 1) {
		ret += array[0] + ".";
		for (i = 0; i < length; i++) {
			ret += '0'
		}
	}

	return ret;
}
'use strict';

var vdsApp = angular.module('vdsApp', [
	'ngResource',
	'ngRoute',
	'ngStorage',
	//'ngTable',
	'ui.bootstrap',
	// 'App.filters',
	'ngMessages',
	'angularUtils.directives.dirPagination',
	'SharedServices',
	'CapitalizeFilter',
	'angular.css.injector',
	'pascalprecht.translate',
	'ngSanitize',/*,
    'angular.js.injector'*/
	/* ,'ng-bootstrap-datepicker'*/
	'ngFileSaver'

]);

/* Logging service*/
vdsApp.factory(
	"traceService",
	function() {
		return ({
			print: printStackTrace
		});
	}
);
vdsApp.provider(
	"$exceptionHandler", {
	$get: function(exceptionLoggingService) {
		return (exceptionLoggingService);
	}
}
);
vdsApp.factory(
	"exceptionLoggingService",
	["$log", "$window", "traceService",
		function($log, $window, traceService) {
			function error(exception, cause) {
				// now try to log the error to the server side.
				try {
					var errorMessage = exception.toString();

					// use our traceService to generate a stack trace
					var stackTrace = traceService.print({ e: exception });

					// use AJAX (in this example jQuery) and NOT
					// an angular service such as $http
					$.ajax({
						type: "POST",
						url: window.location.protocol + '//' + restConfig.host + '/' + restConfig.servicePath + 'clientlogger' + '/' + 'errorLogs',
						contentType: "application/json",
						data: angular.toJson({
							clientUrl: $window.location.href,
							message: errorMessage,
							info: "JS Error",
							stackTrace: stackTrace.toString(),
							//cause: ( cause || ""),
							//status: '',
							//apiURL:''
						})
					});
				} catch (loggingError) {
					$log.warn("Error server-side logging failed");
				}
			}
			return (error);
		}]
);
/**
 * Application Logging Service to give us a way of logging
 * error / debug statements from the client to the server.
 */
vdsApp.factory(
	"applicationLoggingService",
	["$log", "$window", "traceService", function($log, $window, traceService) {
		return ({
			error: function(message) {
				// send server side
				$.ajax({
					type: "POST",
					url: window.location.protocol + '//' + restConfig.host + '/' + restConfig.servicePath + 'clientlogger' + '/' + 'httpLogs',
					contentType: "application/json",
					data: angular.toJson({
						clientUrl: $window.location.href,
						method: message.config.method,
						message: message.statusText,
						targetUrl: message.config.url,
						status: message.status,
						//type: "error",
						//stackTrace: stackTrace.toString(),
						//cause: ''

					})
				});
			},
			debug: function(message) {
				$.ajax({
					type: "POST",
					url: window.location.protocol + '//' + restConfig.host + '/' + restConfig.servicePath + 'clientlogger',
					contentType: "application/json",
					data: angular.toJson({
						clientUrl: $window.location.href,
						method: message.config.method,
						message: message.data.data,
						apiUrl: message.config.url,
						status: message.status,
						//type: "debug",
						//stackTrace : '',
						//cause : ''
					})
				});
			}
		});
	}]
);

vdsApp.config(['$httpProvider', function($httpProvider) {
	/**
		 * this interceptor uses the application logging service to
		 * log server-side any errors from $http requests
		 */
	$httpProvider.interceptors.push([
		'$rootScope', '$q', '$injector', '$location', 'applicationLoggingService',
		function($rootScope, $q, $injector, $location, applicationLoggingService) {
			return {
				response: function(response) {

					// http on success
					return response;
				}, responseError: function(response) {
					vdsAppHelper.handleRedirectionForAngularJs(response);
					var responseCodeConstant = 'CODE_'.concat(response.status);
					response.statusText = HTTP_STATUS_CODES[responseCodeConstant];
					applicationLoggingService.error(response);
					return $q.reject(response);
				}
			};
		}
	]);
}]);

vdsApp.config(
	function ($routeProvider, $compileProvider, $locationProvider) {
		$routeProvider.
	        /*when('/vdsData/:id', {
	            templateUrl: 'views/vdsHome.html',
	            controller: 'VDSHomeController'
	        }).*/
			when('/:id/:debug?', {
				templateUrl: '/repo/app/views/vdsHome.html',
				controller: 'VDSHomeController'
			}).
			when('/pdfExport', {
				templateUrl: 'views/vdsPDFView.html',
				controller: 'vdsPDFDataCtrl'
			}).
			otherwise({
				redirectTo: '/error'
			});

		// use the HTML5 History API
		//vdsApp.locationProvider.html5Mode(true);
		vdsApp.compileProvider = $compileProvider;
	});

/*vdsApp.controller('vdsBaseCtrl', function($scope, vdsServices) {
	
	
});*/
vdsApp.config(['$translateProvider', function ($translateProvider) {
	// add translation table

	
	
	var x = window.location.href.split("/");   // 5th CustoermID  and 6th Language

	urlCusotomerID = x[5];

	// var lang = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
	// var  urlCusotomerID = '';
	// if(lang === 'de' || lang === 'nl' || lang === 'en' || lang === 'fr')
	// {
	// 	urlCusotomerID = window.location.href.split('/').slice(-2)[0];
	// }else 
	// {
	// 	urlCusotomerID = lang;
	// }
	
	var baseURL = window.location.protocol + '//' + restConfig.host + '/';
	
	var tmpLang = baseURL + 'repo/' + atob(urlCusotomerID) + '/LanguageProperties_en.json';
	var LanguageURL = baseURL + 'repo/' + atob(urlCusotomerID) + '/LanguageProperties_';
	var CommonLanguageURL = baseURL + 'repo/app/LanguageProperties_';

	/* $.ajax({
		url:tmpLang,
		async : false,
        error: function()
        {
			
			$translateProvider.useStaticFilesLoader({
				files: [{
					prefix: CommonLanguageURL,
					 suffix: '.json'
					   }]
			});
        },
        success: function()
        {
			
            $translateProvider.useStaticFilesLoader({
				files: [{
					prefix: LanguageURL,
					 suffix: '.json'
				}]
			});
        }
    }); */
	
	$translateProvider.fallbackLanguage('en');
	$translateProvider.useSanitizeValueStrategy('sanitizeParameters');

}]);




angular.module('SharedServices', [])
	.config(function ($httpProvider) {
		$httpProvider.interceptors.push('myHttpInterceptor');
		var spinnerFunction = function (data, headersGetter) {
			// todo start the spinner here
			//alert('start spinner');
			//$('#spinnerDiv').show();
			return data;
		};
		$httpProvider.defaults.transformRequest.push(spinnerFunction);
	})
	.factory('myHttpInterceptor', ['$q', '$rootScope', '$location',
		function ($q, $rootScope, $location) {
			return {
				request: function (config) {
					return config || $q.when(config);
				},
				requestError: function (request) {
					return $q.reject(request);
				},
				response: function (response) {
					//alert('end spinner');
					//$('#spinnerDiv').hide();
					return response || $q.when(response);
				},
				responseError: function (response) {
					vdsAppHelper.handleRedirectionForAngularJs(response);
					if (response && response.status === 404) {
					}
					if (response && response.status >= 500) {
					}
					return $q.reject(response);
				}
			};
		}]);

//Service definition
vdsApp.service('browser', function ($window) {
	this.getinfo = function () {
		var userAgent = $window.navigator.userAgent;

		var browsers = { chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i };

		for (var key in browsers) {
			if (browsers[key].test(userAgent)) {
				return key;
			}
		};

		return null;
	};
});

/*vdsApp.service('browser', ['$window', function($window) {

   // return function() {
	
	 this.getinfo = function(){

        var userAgent = $window.navigator.userAgent;

       var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};

       for(var key in browsers) {
           if (browsers[key].test(userAgent)) {
               return key;
           }
      };

      return 'unknown';
	 }
 //  }

}]);*/
vdsApp.config(function ($provide) {
	$provide.decorator('dirPaginationControlsDirective', function ($delegate) {
		$delegate[0].templateUrl = 'app/js/directives/template/dirPagination.tpl.html';
		return $delegate;
	});
});


vdsApp.value('operatorList', [{
	code: 'O',
	name: 'Or'
}, {
	code: 'A',
	name: 'And'
}]);



vdsApp.filter('startFrom', function () {
	return function (input, start) {
		start = +start; //parse to int
		return input ? input.slice(start) : null;
	};
});

vdsApp.filter('checkbox', function () {
	return function (model, selectedType, type) {

		if (!angular.isUndefined(model) && !angular.isUndefined(selectedType) && selectedType.length > 0) {
			var tempClients = [];
			angular.forEach(selectedType, function (name) {
				angular.forEach(model, function (modelData) {

					if (angular.equals(modelData[type], name)) {
						tempClients.push(modelData);
					}
				});
			});
			return tempClients;
		} else {
			return model;
		}
	};
});

angular.module('CapitalizeFilter', []).
	filter('capitalize', function () {
		return function (input, all) {
			return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			}) : '';
		}
	});

var pageInitialized = false;

function computeProposalNotes(displayNotesTypeInfo, rowObjectProposal, rowObjectProposalFootnoteSymbol, rowObjectProposalFootnoteText, rowObjectNotes, rowObjectResearchNotes) {

	var proposalInfo = new Object;
	proposalInfo.Proposal = '';
	proposalInfo.Notes = '';
	proposalInfo.researchNotes = '';
	proposalInfo.mergedNotes = '';
	proposalInfo.ProposalFootnote = '';

	if (rowObjectProposalFootnoteSymbol != '' && rowObjectProposalFootnoteSymbol != null) {
		var pFootNoteSymbolArr = rowObjectProposalFootnoteSymbol.split(' || ');
		var combinedPFootnotesSymbol = '';
		if (pFootNoteSymbolArr.length > 0) {
			for (i = 0; i < pFootNoteSymbolArr.length; i++) {
				var xyz = String(pFootNoteSymbolArr[i]);
				s = xyz.split(' ** ');

				if (combinedPFootnotesSymbol == '') {
					combinedPFootnotesSymbol += s[1];
				}
				else {
					combinedPFootnotesSymbol += ' ' + s[1];
				}
			}

		}
	}
	else {
		combinedPFootnotesSymbol = '';
	}


	proposalInfo.Proposal = rowObjectProposal + '' + combinedPFootnotesSymbol + '<br />';
	//var displayNotesTypeInfo = jQuery("#list").jqGrid('getGridParam', 'DisplayNotesTypeInfo'); 
	function findUnique(val,uniqueNotes)
	{
	 status = '0';
	 uniqueNotes.forEach(function(itm){
  
		if(itm==val)
		{ 
		status=1;
		}
  
				})
   return status;
   }   
	if (displayNotesTypeInfo > 0) {
		if (displayNotesTypeInfo == 1) {
			if (rowObjectNotes != '' && rowObjectNotes != null) {
				var notesArr = rowObjectNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueNotes = [...new Set(notesArr)];
				let uniqueNotes  = [];
				notesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueNotes);
					if(rtn==0)
					uniqueNotes.push(itm);
					});
				var notesText = '';
				for (var ij = 0; ij < uniqueNotes.length; ij++) {
					//var NotesArrEach = notesArr[ij].split(' : ')
					if (uniqueNotes[ij] != 'NA' && uniqueNotes[ij] != undefined && uniqueNotes[ij] != '') {
						notesText += uniqueNotes[ij] + '<br>';
					}
				}
				if (notesText != '') {
					//proposalInfo.Notes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Voting Rationale:&nbsp<br>'+notesText+'</i></div>';
					proposalInfo.Notes += notesText;
				}
			}
		}
		else if (displayNotesTypeInfo == 2) {
			if (rowObjectResearchNotes != '' && rowObjectResearchNotes != null) {
				var ResearchNotesArr = rowObjectResearchNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueResearchNotes = [...new Set(ResearchNotesArr)];
				let uniqueResearchNotes  = [];
				ResearchNotesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueResearchNotes);
					if(rtn==0)
					uniqueResearchNotes.push(itm);
					});
				var ResearchNotesText = '';
				for (var ij = 0; ij < uniqueResearchNotes.length; ij++) {
					//var ResearchNotesArrEach = ResearchNotesArr[ij].split(' : ')
					if (uniqueResearchNotes[ij] != 'NA' && uniqueResearchNotes[ij] != undefined && uniqueResearchNotes[ij] != '') {
						ResearchNotesText += uniqueResearchNotes[ij] + '<br>';
					}
				}
				if (ResearchNotesText != '') {
					//proposalInfo.researchNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Policy Rationale:&nbsp<br>'+ResearchNotesText+'</i></div>';
					proposalInfo.researchNotes += ResearchNotesText;
				}
			}
		}
		else if (displayNotesTypeInfo == 3) {
			if (rowObjectNotes != '' && rowObjectNotes != null) {
				//var notesText = rowObjectNotes.replace(/ || /g,'<br>');
				//var notesText = rowObjectNotes.replace('<br>','');
				var notesArr = rowObjectNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueNotes = [...new Set(notesArr)];
				let uniqueNotes  = [];
				notesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueNotes);
					if(rtn==0)
					uniqueNotes.push(itm);
					});
				var notesText = '';
				for (var ij = 0; ij < uniqueNotes.length; ij++) {
					//var NotesArrEach = uniqueNotes[ij].split(' : ')
					if (uniqueNotes[ij] != 'NA' && uniqueNotes[ij] != undefined && uniqueNotes[ij] != '') {
						notesText += uniqueNotes[ij] + '<br>';
					}
				}
				if (notesText != '') {
					//proposalInfo.Notes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Voting Rationale:&nbsp<br>'+notesText+'</i></div>';
					proposalInfo.Notes += notesText;
				}
			}
			if (rowObjectResearchNotes != '' && rowObjectResearchNotes != null) {
				var ResearchNotesArr = rowObjectResearchNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueResearchNotes = [...new Set(ResearchNotesArr)];
				let uniqueResearchNotes  = [];
				ResearchNotesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueResearchNotes);
					if(rtn==0)
					uniqueResearchNotes.push(itm);
					});
				var ResearchNotesText = '';
				for (var ij = 0; ij < uniqueResearchNotes.length; ij++) {
					if (uniqueResearchNotes[ij] != 'NA' && uniqueResearchNotes[ij] != undefined && uniqueResearchNotes[ij] != '') {
						ResearchNotesText += uniqueResearchNotes[ij] + '<br>';
					}
				}
				if (ResearchNotesText != '') {
					//proposalInfo.researchNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Policy Rationale:&nbsp<br>'+ResearchNotesText+'</i></div>';
					proposalInfo.researchNotes += ResearchNotesText;
				}
			}
		}
		else if (displayNotesTypeInfo == 4) {
			if (rowObjectNotes != '' && rowObjectNotes != null) {
				var notesArr = rowObjectNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueNotes = [...new Set(notesArr)];
				let uniqueNotes  = [];
				notesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueNotes);
					if(rtn==0)
					uniqueNotes.push(itm);
					});
				var notesText = '';
				for (var ij = 0; ij < uniqueNotes.length; ij++) {
					if (uniqueNotes[ij] != 'NA' && uniqueNotes[ij] != undefined && uniqueNotes[ij] != '') {
						notesText += uniqueNotes[ij] + '<br>';
					}
				}
				if (notesText != '') {
					//proposalInfo.mergedNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Voting Rationale:&nbsp<br>'+notesText+'</i></div>';
					proposalInfo.mergedNotes += notesText;
				}
			}

			if (rowObjectResearchNotes != '' && rowObjectResearchNotes != null && proposalInfo.mergedNotes == '') {
				var ResearchNotesArr = rowObjectResearchNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueResearchNotes = [...new Set(ResearchNotesArr)];
				let uniqueResearchNotes  = [];
				ResearchNotesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueResearchNotes);
					if(rtn==0)
					uniqueResearchNotes.push(itm);
					});
				
				var ResearchNotesText = '';
				for (var ij = 0; ij < uniqueResearchNotes.length; ij++) {
					if (uniqueResearchNotes[ij] != 'NA' && uniqueResearchNotes[ij] != undefined && uniqueResearchNotes[ij] != '') {
						ResearchNotesText += uniqueResearchNotes[ij] + '<br>';
					}
				}
				if (ResearchNotesText != '') {
					//proposalInfo.mergedNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Policy Rationale:&nbsp<br>'+ResearchNotesText+'</i></div>';
					proposalInfo.mergedNotes += ResearchNotesText;
				}
			}
		}

	}
	else {
		proposalInfo.Proposal = rowObjectProposal + '' + combinedPFootnotesSymbol + '<br />';
	}


	//if(rowObjectProposalFootnoteSymbol != '' && rowObjectProposalFootnoteText != '')
	if (rowObjectProposalFootnoteText != '') {

		var pFootNoteTxtArr = rowObjectProposalFootnoteText.split(' || ');
		var pFootNoteSymbolArr = rowObjectProposalFootnoteSymbol.split(' || ');

		if (pFootNoteTxtArr.length > 0) {
			var combinedPFootnotes = '';
			for (i = 0; i < pFootNoteTxtArr.length; i++) {

				var abcd = String(pFootNoteTxtArr[i]);
				t = abcd.split(' ** ');

				var xyz = String(pFootNoteSymbolArr[i]);
				s = xyz.split(' ** ');

				//console.log(t[0]+'----------'+t[1]+'----------'+s[1]);
				if (s[1] == undefined)
					s[1] = '';
				combinedPFootnotes += t[0] + s[1] + ' : ' + t[1] + '<br>';
			}

			if (combinedPFootnotes != '') {
				//proposalInfo.ProposalFootnote += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>'+combinedPFootnotes+'</i></div>';	
				proposalInfo.ProposalFootnote += combinedPFootnotes;
			}
		}

	}

	return proposalInfo;
}
function updatedLanguageProp(global, local)
{
	var finalJson = {};
	var size = 0;
	for(var i in global){
		var myObject = new Object();
		var flag = false;
		var globalKey = i;
		for(var j in local)
		{
			var localKey = j;
			if(i === j)
			{
				flag = true;
				if(global[i] instanceof Object) {
					
					var innerList = {};
					for(var innerGlobal in global[i])
					{
						var object = new Object();
						var innerFlag = false;
						var innerGlobalKey = innerGlobal;
						for(var innerLocal in local[j])
						{
							var innerLocalKey = innerLocal;
							if(innerGlobalKey === innerLocalKey)
							{
								innerFlag = true;
								innerList[innerLocalKey] = local[j][innerLocalKey];
								break;
							}
						}
						if(!innerFlag)
						{
							innerList[innerGlobalKey] = global[i][innerGlobalKey];
							
						}
					}
					finalJson[globalKey] = innerList;
				} else {
					finalJson[localKey] = local[j];
				}
				break;
			}
		}
		if(!flag)
		{
			finalJson[globalKey] = global[globalKey];
		}
	}
	return finalJson;
};
/* VDS- 804 Added Contextual note parameter */
function computeProposalNotes(displayNotesTypeInfo, rowObjectProposal, rowObjectProposalFootnoteSymbol, rowObjectProposalFootnoteText, rowObjectNotes, rowObjectResearchNotes, rowObjectContextualNotes) {

	var proposalInfo = new Object;
	proposalInfo.Proposal = '';
	proposalInfo.Notes = '';
	proposalInfo.researchNotes = '';
	proposalInfo.mergedNotes = '';
	proposalInfo.ProposalFootnote = '';

	if (rowObjectProposalFootnoteSymbol != '' && rowObjectProposalFootnoteSymbol != null) {
		var pFootNoteSymbolArr = rowObjectProposalFootnoteSymbol.split(' || ');
		var combinedPFootnotesSymbol = '';
		if (pFootNoteSymbolArr.length > 0) {
			for (var z = 0; z < pFootNoteSymbolArr.length; z++) {
				var xyz = String(pFootNoteSymbolArr[z]);
				s = xyz.split(' ** ');

				if (combinedPFootnotesSymbol == '') {
					combinedPFootnotesSymbol += s[1];
				}
				else {
					combinedPFootnotesSymbol += ' ' + s[1];
				}
			}

		}
	}
	else {
		combinedPFootnotesSymbol = '';
	}


	proposalInfo.Proposal = rowObjectProposal + '' + combinedPFootnotesSymbol + '<br />';
	//var displayNotesTypeInfo = jQuery("#list").jqGrid('getGridParam', 'DisplayNotesTypeInfo'); 
	function findUnique(val,uniqueNotes)
	{
	 status = '0';
	 uniqueNotes.forEach(function(itm){
  
		if(itm==val)
		{ 
		status=1;
		}
  
				})
   return status;
   }   
	if (displayNotesTypeInfo > 0) {
		if (displayNotesTypeInfo == 1) {
			if (rowObjectNotes != '' && rowObjectNotes != null) {
				var notesArr = rowObjectNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueNotes = [...new Set(notesArr)];
				let uniqueNotes  = [];
				notesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueNotes);
					if(rtn==0)
					uniqueNotes.push(itm);
					});
				var notesText = '';
				for (var ij = 0; ij < uniqueNotes.length; ij++) {
					//var NotesArrEach = notesArr[ij].split(' : ')
					if (uniqueNotes[ij] != 'NA' && uniqueNotes[ij] != undefined && uniqueNotes[ij] != '') {
						notesText += uniqueNotes[ij] + '<br>';
					}
				}
				if (notesText != '') {
					//proposalInfo.Notes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Voting Rationale:&nbsp<br>'+notesText+'</i></div>';
					proposalInfo.Notes += notesText;
				}
			}
		}
		else if (displayNotesTypeInfo == 2) {
			if (rowObjectResearchNotes != '' && rowObjectResearchNotes != null) {
				var ResearchNotesArr = rowObjectResearchNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueResearchNotes = [...new Set(ResearchNotesArr)];
				let uniqueResearchNotes  = [];
				ResearchNotesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueResearchNotes);
					if(rtn==0)
					uniqueResearchNotes.push(itm);
					});
				var ResearchNotesText = '';
				for (var ij = 0; ij < uniqueResearchNotes.length; ij++) {
					//var ResearchNotesArrEach = ResearchNotesArr[ij].split(' : ')
					if (uniqueResearchNotes[ij] != 'NA' && uniqueResearchNotes[ij] != undefined && uniqueResearchNotes[ij] != '') {
						ResearchNotesText += uniqueResearchNotes[ij] + '<br>';
					}
				}
				if (ResearchNotesText != '') {
					//proposalInfo.researchNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Policy Rationale:&nbsp<br>'+ResearchNotesText+'</i></div>';
					proposalInfo.researchNotes += ResearchNotesText;
				}
			}
		}
		else if (displayNotesTypeInfo == 3) {
			if (rowObjectNotes != '' && rowObjectNotes != null) {
				//var notesText = rowObjectNotes.replace(/ || /g,'<br>');
				//var notesText = rowObjectNotes.replace('<br>','');
				var notesArr = rowObjectNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueNotes = [...new Set(notesArr)];
				let uniqueNotes  = [];
				notesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueNotes);
					if(rtn==0)
					uniqueNotes.push(itm);
					});
				var notesText = '';
				for (var ij = 0; ij < uniqueNotes.length; ij++) {
					//var NotesArrEach = uniqueNotes[ij].split(' : ')
					if (uniqueNotes[ij] != 'NA' && uniqueNotes[ij] != undefined && uniqueNotes[ij] != '') {
						notesText += uniqueNotes[ij] + '<br>';
					}
				}
				if (notesText != '') {
					//proposalInfo.Notes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Voting Rationale:&nbsp<br>'+notesText+'</i></div>';
					proposalInfo.Notes += notesText;
				}
			}
			if (rowObjectResearchNotes != '' && rowObjectResearchNotes != null) {
				var ResearchNotesArr = rowObjectResearchNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueResearchNotes = [...new Set(ResearchNotesArr)];
				let uniqueResearchNotes  = [];
				ResearchNotesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueResearchNotes);
					if(rtn==0)
					uniqueResearchNotes.push(itm);
					});
				var ResearchNotesText = '';
				for (var ij = 0; ij < uniqueResearchNotes.length; ij++) {
					if (uniqueResearchNotes[ij] != 'NA' && uniqueResearchNotes[ij] != undefined && uniqueResearchNotes[ij] != '') {
						ResearchNotesText += uniqueResearchNotes[ij] + '<br>';
					}
				}
				if (ResearchNotesText != '') {
					//proposalInfo.researchNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Policy Rationale:&nbsp<br>'+ResearchNotesText+'</i></div>';
					proposalInfo.researchNotes += ResearchNotesText;
				}
			}
		}
		else if (displayNotesTypeInfo == 4) {
			if (rowObjectNotes != '' && rowObjectNotes != null) {
				var notesArr = rowObjectNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueNotes = [...new Set(notesArr)];
				let uniqueNotes  = [];
				notesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueNotes);
					if(rtn==0)
					uniqueNotes.push(itm);
					});
				var notesText = '';
				for (var ij = 0; ij < uniqueNotes.length; ij++) {
					if (uniqueNotes[ij] != 'NA' && uniqueNotes[ij] != undefined && uniqueNotes[ij] != '') {
						notesText += uniqueNotes[ij] + '<br>';
					}
				}
				if (notesText != '') {
					//proposalInfo.mergedNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Voting Rationale:&nbsp<br>'+notesText+'</i></div>';
					proposalInfo.mergedNotes += notesText;
				}
			}

			if (rowObjectResearchNotes != '' && rowObjectResearchNotes != null && proposalInfo.mergedNotes == '') {
				var ResearchNotesArr = rowObjectResearchNotes.split('<br>').map(function (item) {return item.trim()});
				//let uniqueResearchNotes = [...new Set(ResearchNotesArr)];
				let uniqueResearchNotes  = [];
				ResearchNotesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueResearchNotes);
					if(rtn==0)
					uniqueResearchNotes.push(itm);
					});
				
				var ResearchNotesText = '';
				for (var ij = 0; ij < uniqueResearchNotes.length; ij++) {
					if (uniqueResearchNotes[ij] != 'NA' && uniqueResearchNotes[ij] != undefined && uniqueResearchNotes[ij] != '') {
						ResearchNotesText += uniqueResearchNotes[ij] + '<br>';
					}
				}
				if (ResearchNotesText != '') {
					//proposalInfo.mergedNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Policy Rationale:&nbsp<br>'+ResearchNotesText+'</i></div>';
					proposalInfo.mergedNotes += ResearchNotesText;
				}
			}
		}
		else if (displayNotesTypeInfo == 5) {
			if (rowObjectContextualNotes != '' && rowObjectContextualNotes != null) {
				var contextualNotesArr = rowObjectContextualNotes.split('<br>').map(function (item) {return item.trim()});
				let uniqueContextualNotes  = [];
				contextualNotesArr.forEach(function(itm){
					rtn =  findUnique(itm, uniqueContextualNotes);
					if(rtn==0)
					uniqueContextualNotes.push(itm);
					});
				var ContextualNotesText = '';
				for (var ij = 0; ij < uniqueContextualNotes.length; ij++) {
					if (uniqueContextualNotes[ij] != 'NA' && uniqueContextualNotes[ij] != undefined && uniqueContextualNotes[ij] != '') {
						ContextualNotesText += uniqueContextualNotes[ij] + '<br>';
					}
				}
				if (ContextualNotesText != '') {
					//proposalInfo.researchNotes += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>Policy Rationale:&nbsp<br>'+ContextualNotesText+'</i></div>';
					proposalInfo.mergedNotes += ContextualNotesText;
				}
			}
		}

	}
	else {
		proposalInfo.Proposal = rowObjectProposal + '' + combinedPFootnotesSymbol + '<br />';
	}


	//if(rowObjectProposalFootnoteSymbol != '' && rowObjectProposalFootnoteText != '')
	if (rowObjectProposalFootnoteText != '' && rowObjectProposalFootnoteText != null) {

		var pFootNoteTxtArr = rowObjectProposalFootnoteText.split(' || ');
		var pFootNoteSymbolArr = rowObjectProposalFootnoteSymbol.split(' || ');

		if (pFootNoteTxtArr.length > 0) {
			var combinedPFootnotes = '';
			for (var z = 0; z < pFootNoteTxtArr.length; z++) {

				var abcd = String(pFootNoteTxtArr[z]);
				t = abcd.split(' ** ');

				var xyz = String(pFootNoteSymbolArr[z]);
				s = xyz.split(' ** ');

				//console.log(t[0]+'----------'+t[1]+'----------'+s[1]);
				if (s[1] == undefined)
					s[1] = '';
				combinedPFootnotes += t[0] + s[1] + ' : ' + t[1] + '<br>';
			}

			if (combinedPFootnotes != '') {
				//proposalInfo.ProposalFootnote += '<div style="color:grey; font-size: 11px; margin-left: 15px; margin-top: 7px; line-height: 15px; text-align: justify;"><i>'+combinedPFootnotes+'</i></div>';	
				proposalInfo.ProposalFootnote += combinedPFootnotes;
			}
		}

	}

	return proposalInfo;
}

'use strict';

vdsApp.controller('VDSHomeController', function($scope, $compile, $http, $routeParams, vdsServices, cssInjector, LazyDirectiveLoader, $translate, applicationLoggingService) {
	vdsAppHelper.encodedClientId = $routeParams.id;
	vdsServices.getCustomerFundData($routeParams.id).$promise.then(function (response) {
		const seen = new Set();
		var x = response.data;
	
		if( response.data !== undefined){

			const filteredArr = x.filter(function(el) {
				const duplicate = seen.has(el.fundID);
				seen.add(el.fundID);
				return !duplicate;
				  });
				vdsServices.setFundData(filteredArr);
		}
		else
		{
			vdsServices.setFundData(response.data);
		}
	


		vdsServices.getCustomerPreference($routeParams.id).$promise.then(function (response) {
			//@TODO : remove data and array from api
			vdsServices.setPreference(vdsServices.getPreference().data[0]);
			// VDS-1150: Method that upadtes the customer preferences based on the DB values
			vdsAppHelper.updateCustomerPreferences(vdsServices.getPreference());
			//vdsServices.setPreference(response.data[0]);
			//console.log('Init search pref' );

			vdsServices.setCustomerId(vdsServices.getPreference().CustomerID);

			vdsServices.setMeetingDetailColumns(vdsServices.getPreference().MeetingDetailsColumns);

            //VDS-1391 - Get preferences for meeting detail headers [START]
			vdsServices.setMeetingDetailHeaders(vdsServices.getPreference().MeetingDetailHeaders);
            //VDS-1391 - Get preferences for meeting detail headers [END]



			$http.get(vdsServices.getBaseURL() + 'repo/VDSComponents.json?version=' + Math.random()).then(function (jsonFile) {

				$scope.directiveData = jsonFile.data.directives;

				vdsServices.setStandardFreeText(jsonFile.data.standardFreeText);
				vdsServices.setCSSJSVersion(jsonFile.data.CSSJSVersion);
				vdsServices.setVDSComponentsJSON(jsonFile.data);
			
				$http.get(vdsServices.getBaseURL() + 'repo/app/DashboardProperties.json?version=' + Math.random()).then(function (jsonPropertiesFile) {

					vdsServices.setDashboardProperties(jsonPropertiesFile.data);
					var CustomPropertiesUrl = vdsServices.getBaseURL() + 'repo/' + vdsServices.getCustomerId() + '/CustomProperties.json?version=' + Math.random();
					$http.get(CustomPropertiesUrl)
						.success(function (customPropertiesFile, status) {
							//$scope.data.products = customPropertiesFile.data;								
							//console.log('success status=>'+status); 
						
							vdsServices.setCSSJSVersion(jsonFile.data.CSSJSVersion + '_' + customPropertiesFile.CSSJSVersion_append);
								
							cssInjector.add(vdsServices.getBaseURL() + 'repo/' + vdsServices.getCustomerId() + '/css/VDSStyles.css?version=' + vdsServices.getCSSJSVersion());
							if (vdsServices.getPreference().IncludePrintCSS == true || vdsServices.getPreference().StagingIncludePrintCSS == true) {
								cssInjector.add(vdsServices.getBaseURL() + 'repo/app/css/print.css?version=' + vdsServices.getCSSJSVersion());
								if (vdsServices.getPreference().IncludeHeader == false) {
									cssInjector.add(vdsServices.getBaseURL() + 'repo/app/css/header.css?version=' + vdsServices.getCSSJSVersion());
								}
								if (vdsServices.getPreference().IncludeLogo == false) {
									cssInjector.add(vdsServices.getBaseURL() + 'repo/app/css/logo.css?version=' + vdsServices.getCSSJSVersion());
								}								
								if (vdsServices.getPreference().Includepolicysection == false) {
									cssInjector.add(vdsServices.getBaseURL() + 'repo/app/css/policysection.css?version=' + vdsServices.getCSSJSVersion());
								}
								if (vdsServices.getPreference().AppliedFilterText == true) {
									cssInjector.add(vdsServices.getBaseURL() + 'repo/app/css/appliedfilter.css?version=' + vdsServices.getCSSJSVersion());
								}
							}

							vdsServices.setCustomProperties(customPropertiesFile);
							if (customPropertiesFile.directiveFile == 'global') {
								var loadDirectiveFile = vdsServices.getBaseURL() + 'repo/app/js/vds_components/CommonDirective.js?version=' + vdsServices.getCSSJSVersion() + '&random=' + Math.random();
							}
							else {
								var loadDirectiveFile = vdsServices.getBaseURL() + 'repo/' + vdsServices.getCustomerId() + '/directives/customDirective.js?version=' + vdsServices.getCSSJSVersion() + '&random=' + Math.random();
							}
						
							var x =  window.location.href.split("/");   // 5th CustoermID  and 6th Language
							localLang = x[6];

							if(localLang !== 'de' && localLang !== 'nl' && localLang !== 'en' && localLang !== 'fr')
							{
								localLang = 'en';
							}
							$translate.use(localLang);
							vdsServices.setlanguageUse(localLang);
							var customLanguageProperties = '';
                            //Check if language file is present in client folder.
                            var langFilepromise='';
							var localLangPromRes = vdsUtility.getPromiseWithResolvers();
							if (customPropertiesFile.hasLangFile != undefined && customPropertiesFile.hasLangFile != '' && customPropertiesFile.hasLangFile == 'true') {

								var languagePropertiesUrl = vdsServices.getBaseURL() + 'repo/' + vdsServices.getCustomerId() + '/LanguageProperties_' + localLang + '.json?version=' + Math.random();
								
								 langFilepromise = $http.get(languagePropertiesUrl)
										.success(function (PreferLanguagePropertiesFile, status) {
											try {
												customLanguageProperties = PreferLanguagePropertiesFile;
												vdsServices.setCommonOrCustomLanguage('custom');
												if (localLang != 'en') {
													vdsServices.setPreferLanguageProperties(PreferLanguagePropertiesFile);
												}
											} finally {
												localLangPromRes.resolve();
											}
										})
										.error(function (error, status) {
											try {
											    /*var CommonLanguageURL = vdsServices.getBaseURL() + 'repo/app/LanguageProperties_'+localLang+'.json?version=' + Math.random();
											    $http.get(CommonLanguageURL)
											    .success(function (PreferLanguagePropertiesFile,status){
											    vdsServices.setPreferLanguageProperties(PreferLanguagePropertiesFile);*/
											    vdsServices.setCommonOrCustomLanguage('common');
											    if (localLang != 'en') {
											    	vdsServices.setPreferLanguageProperties('');
											    }
											} finally {
												localLangPromRes.resolve();
											}
										});
							} else {
								localLangPromRes.resolve();	
							}

							//Changes to merge Global and local LanguageProperties file and global property will be overriden with local property if present in Local LanguageProperties files
							var commonLangPromRes = vdsUtility.getPromiseWithResolvers();
							if (localLang == 'en') {
								var globalLanguageProperties = '';
								var CommonLanguageURL = vdsServices.getBaseURL() + 'repo/app/LanguageProperties_' + localLang + '.json?version=' + Math.random();
								if (customPropertiesFile.hasLangFile != undefined && customPropertiesFile.hasLangFile != '' && customPropertiesFile.hasLangFile == 'true') {
									langFilepromise.then(function () {
										$http.get(CommonLanguageURL)
											.success(function (PreferLanguagePropertiesFile, status) {
												try {
													globalLanguageProperties = PreferLanguagePropertiesFile;
													vdsServices.setPreferLanguageProperties(updatedLanguageProp(globalLanguageProperties, customLanguageProperties));
												} finally {
													commonLangPromRes.resolve();
												}
											});
									}, function error(response) {
										$http.get(CommonLanguageURL)
											.success(function (PreferLanguagePropertiesFile, status) {
												try {
													globalLanguageProperties = PreferLanguagePropertiesFile;
													vdsServices.setPreferLanguageProperties(updatedLanguageProp(globalLanguageProperties, customLanguageProperties));
												} finally {
													commonLangPromRes.resolve();
												}
											});
									});
								} else {
									$http.get(CommonLanguageURL)
										.success(function (PreferLanguagePropertiesFile, status) {
											try {
												globalLanguageProperties = PreferLanguagePropertiesFile;
												vdsServices.setPreferLanguageProperties(updatedLanguageProp(globalLanguageProperties, customLanguageProperties));
											} finally {
												commonLangPromRes.resolve();
											}
										});
								}
							} else {
							    commonLangPromRes.resolve();
							}

							Promise.all([localLangPromRes.promise, commonLangPromRes.promise]).then(()=>{
								//@NOTE : LazyDirectiveLoader parameters (fileName , file path)
								LazyDirectiveLoader.load('customDirective', loadDirectiveFile).then(function () {
								
									angular.forEach(vdsServices.getCustomerTemplate(), function (templateValue) {
									
										angular.forEach($scope.directiveData, function (directiveValue) {
											if (directiveValue.componentID == templateValue) {
											
												angular.element($('#vdsBaseTempl')).append($compile('<' + directiveValue.directiveName + '  data="directiveData"></' + directiveValue.directiveName + '> ')($scope));
											}
	
										});
									});
	
	
								});
							});



						})
						.error(function (error, status) {
							//$scope.data.error = { message: error, status: status};	

							cssInjector.add(vdsServices.getBaseURL() + 'repo/' + vdsServices.getCustomerId() + '/css/VDSStyles.css?version=' + vdsServices.getCSSJSVersion());

							var loadDirectiveFile = vdsServices.getBaseURL() + 'repo/' + vdsServices.getCustomerId() + '/directives/customDirective.js?version=' + vdsServices.getCSSJSVersion() + '&random=' + Math.random();
							
							var x =  window.location.href.split("/");   // 5th CustoermID  and 6th Language
							localLang = x[6];
							
							if(localLang !== 'de' && localLang !== 'nl' && localLang !== 'en' && localLang !== 'fr')
							{
								localLang = 'en';
							}
							$translate.use(localLang);
							
							var langFilepromise='';
							var customLanguageProperties = '';
							var localLangPromRes = vdsUtility.getPromiseWithResolvers();
							var languagePropertiesUrl =  vdsServices.getBaseURL() + 'repo/' + vdsServices.getCustomerId() + '/LanguageProperties_'+localLang+'.json?version=' + Math.random();
							langFilepromise = $http.get(languagePropertiesUrl)
								.success(function (PreferLanguagePropertiesFile,status){
									try {
										customLanguageProperties = PreferLanguagePropertiesFile;
										vdsServices.setCommonOrCustomLanguage('custom');
										if(localLang != 'en')
										{
											vdsServices.setPreferLanguageProperties(PreferLanguagePropertiesFile);
										}
									} finally {
										localLangPromRes.resolve();
									}
								})
								.error(function (error, status) {
									try {
										/*var CommonLanguageURL = vdsServices.getBaseURL() + 'repo/app/LanguageProperties_'+localLang+'.json?version=' + Math.random();
										$http.get(CommonLanguageURL)
										.success(function (PreferLanguagePropertiesFile,status){
										vdsServices.setPreferLanguageProperties(PreferLanguagePropertiesFile);*/
										vdsServices.setCommonOrCustomLanguage('common');
										if(localLang != 'en')
										{
										vdsServices.setPreferLanguageProperties('');	
										}
									} finally {
										localLangPromRes.resolve();
									}
								});
							//Changes to merge Global and local LanguageProperties file and global property will be overriden with local property if present in Local LanguageProperties files
							var commonLangPromRes = vdsUtility.getPromiseWithResolvers();
							if(localLang=='en'){
							var globalLanguageProperties = '';
							var CommonLanguageURL = vdsServices.getBaseURL() + 'repo/app/LanguageProperties_'+localLang+'.json?version=' + Math.random();
							langFilepromise.then(function () {
								$http.get(CommonLanguageURL)
									.success(function (PreferLanguagePropertiesFile, status) {
										try {
											globalLanguageProperties = PreferLanguagePropertiesFile;
											vdsServices.setPreferLanguageProperties(updatedLanguageProp(globalLanguageProperties, customLanguageProperties));
										} finally {
											commonLangPromRes.resolve();
										}
									});
							}, function error(response) {
								$http.get(CommonLanguageURL)
									.success(function (PreferLanguagePropertiesFile, status) {
										try {
											globalLanguageProperties = PreferLanguagePropertiesFile;
											vdsServices.setPreferLanguageProperties(updatedLanguageProp(globalLanguageProperties, customLanguageProperties));
										} finally {
											commonLangPromRes.resolve();
										}
									});
							});	
							} else{
								commonLangPromRes.resolve();
							}

						//});
						    Promise.all([localLangPromRes.promise, commonLangPromRes.promise]).then(()=>{
								//@NOTE : LazyDirectiveLoader parameters (fileName , file path)
								LazyDirectiveLoader.load('customDirective', loadDirectiveFile).then(function () {
	
									angular.forEach(vdsServices.getCustomerTemplate(), function (templateValue) {
										angular.forEach($scope.directiveData, function (directiveValue) {
											if (directiveValue.componentID == templateValue) {
												angular.element($('#vdsBaseTempl')).append($compile('<' + directiveValue.directiveName + '  data="directiveData"></' + directiveValue.directiveName + '> ')($scope));
											}
	
										});
									});
	
	
								});
							});
						});



				});
			});



		});

	});


});



'use strict';
var LatestSearchCriteria = '';
vdsApp.factory('vdsServices', function ($resource, $rootScope) {

	var model = {};
	var params = {};
	var customerPreference = {};
	var CountryList = {};
	var fundData = {};
	var meetingTypeList = {};
	var votedYNList = {};
	var voteCastAgainstMgmt = {};
	var customerId = null;
	//@TODO : rename it to meaningful name. this name should match the json response.
	var industryPercentage = {};
	var meetingTypeUI = {};
	var meetingByMarket = {};
	var customerTemplate = [];
	var standardFreeText = "";
	var CSSJSVersion = "";
	var VDSComponentsJSON = "";
	var DashboardProperties = "";
	var CustomProperties = "";
	var votingStatistics = {};
	var votingCastProposalCategory = {};
	var votingCastAlignMgmtProposalCategory = {};
	var isLiveSite = 1;
	var bodyTemplate = '';
	var PreferLanguageProperties = '';
	var CommonOrCustomLanguage = '';
	var isHeatSelected = '';
	var graphSectionSelected = '';
	var languageUse = '';
	var meetingDetailColumns = '';

	//var baseURL = 'http://' + restConfig.host + '/' ;
	var baseURL = window.location.protocol + '//' + restConfig.host + '/';


	//API URL Example : http://localhost:8080/vdsapi/getVdsData/1?customerID=OTk5OTk5&fromDate=2012-01-01&toDate=2015-05-08&liveSiteYN=1

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

	//console.log('isLiveSite=>'+isLiveSite);

	var ref = $resource(baseURL + restConfig.servicePath + 'getVdsData/:api',
		params, {
			'get': {
				method: 'GET',
				isArray: false,
				responseType: 'json'
			},
			'query': {
				method: 'GET',
				isArray: false,
				responseType: 'json'
			},
			'save': {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			},
			'create': {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		});




	//API object that is given to entities that need this service
	var Rest = {
		setMeetingDetailColumns: function (data) {
			meetingDetailColumns = data;
			try {
				//split the pipe separated data into an array
				 vdsAppHelper.meetingDetailsSplitColumns = meetingDetailColumns.split("|").map(header=>header.trim());
			   } catch(err){
				   vdsAppHelper.meetingDetailsSplitColumns = [];
				 console.error(err);
			   }
		},
		getMeetingDetailColumns: function () {
			return meetingDetailColumns;
		},
        //VDS-1391 - Getter and setter for meeting detail headers [START]
		setMeetingDetailHeaders: function (data) {
			meetingDetailHeaders = data;
			try {
             //split the pipe separated data into an array
			  vdsAppHelper.meetingDetailHeadersColumns = meetingDetailHeaders.split("|").map(header=>header.trim());
			} catch(err){
				vdsAppHelper.meetingDetailHeadersColumns = [];
              console.error(err);
			}
		},
		getMeetingDetailHeaders: function () {
			return meetingDetailHeaders;
		},
        //VDS-1391 - Getter and setter for meeting detail headers [END]

		getCustomerPreference: function (customerID) {

			this.setPreference(ref.query({
				api: 2,
				customerID: customerID,
				fromDate: '',
				toDate: '',
				liveSiteYN: isLiveSite,
				actionCode: 100,
				sessionToken: loggerHelperConfig.sessionToken,
				random: Math.random()

			}));

			return customerPreference;

		},
		getCustomerFundData: function (customerID) {
			this.setFundData(ref.query({
				api: 4,
				customerID: customerID,
				fromDate: '',
				toDate: '',
				liveSiteYN: isLiveSite,
				language: 'en',
				actionCode: 100,
				locale: getLanguageFromUrl(),
				sessionToken: loggerHelperConfig.sessionToken,
				random: Math.random()

			}));

			return fundData;

		},
		getVDSData: function (customerID, searchParams) {


			LatestSearchCriteria = searchParams;

			var graphData = ref.query({
				api: 6,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				companyOrTicker: searchParams.companyOrTicker,
				fundValue: searchParams.fundValue,
				liveSiteYN: isLiveSite,
				random: Math.random()

			});

			return graphData;

		},

		getGetCountryList: function (customerID, searchParams) {

			var CountryList = ref.query({
				api: 15,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				liveSiteYN: isLiveSite,
				actionCode: 100,
				sessionToken: loggerHelperConfig.sessionToken,
				random: Math.random()
			});

			return CountryList;

		},

		getGraphData_Type: function (customerID, searchParams) {


			LatestSearchCriteria = searchParams;

			var graphData = ref.query({
				api: 8,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				companyOrTicker: searchParams.companyOrTicker,
				fundValue: searchParams.fundValue,
				liveSiteYN: isLiveSite,
				random: Math.random()


			});

			return graphData;

		},

		getGraphData_Market: function (customerID, searchParams) {


			LatestSearchCriteria = searchParams;

			var graphData = ref.query({
				api: 9,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				companyOrTicker: searchParams.companyOrTicker,
				fundValue: searchParams.fundValue,
				liveSiteYN: isLiveSite,
				random: Math.random()


			});

			return graphData;

		},

		getGraphData_VotesCastAlignmentManagement: function (customerID, searchParams) {


			LatestSearchCriteria = searchParams;

			var graphData = ref.query({
				api: 10,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				companyOrTicker: searchParams.companyOrTicker,
				fundValue: searchParams.fundValue,
				liveSiteYN: isLiveSite,
				random: Math.random()


			});

			return graphData;

		},

		getGraphData_MeetingsBySector: function (customerID, searchParams) {


			LatestSearchCriteria = searchParams;

			var graphData = ref.query({
				api: 11,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				companyOrTicker: searchParams.companyOrTicker,
				fundValue: searchParams.fundValue,
				liveSiteYN: isLiveSite,
				random: Math.random()


			});

			return graphData;

		},

		getGraphData_VotingStatistics: function (customerID, searchParams) {


			LatestSearchCriteria = searchParams;

			var graphData = ref.query({
				api: 12,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				companyOrTicker: searchParams.companyOrTicker,
				fundValue: searchParams.fundValue,
				liveSiteYN: isLiveSite,
				random: Math.random()


			});

			return graphData;

		},

		getGraphData_VoteCastProposalCategory: function (customerID, searchParams) {


			LatestSearchCriteria = searchParams;

			var graphData = ref.query({
				api: 13,
				customerID: customerID,
				fromDate: searchParams.fromDate,
				toDate: searchParams.toDate,
				companyOrTicker: searchParams.companyOrTicker,
				fundValue: searchParams.fundValue,
				liveSiteYN: isLiveSite,
				random: Math.random()


			});

			return graphData;

		},


		getMeetingDetails: function (meetingID, fundID) {
			//console.log("customer " + customerPreference.customerId + " meeting " + meetingID + " fund " + fundID);
			
			return ref.query({
				request: 'details',
				id: customerPreference.customerId,
				meetingID: meetingID,
				fundID: fundID,
				random: Math.random()
			});

		},
		getCustomerId: function () {
			return customerId;
		},
		setCustomerId: function (data) {
			customerId = data;
		},
		getModel: function () {
			return model;
		},
		setModel: function (data) {
			model = data;
		},
		getCustomerTemplate: function () {
			var customerTemplate = this.getPreference().CustomerTemplate;
			return customerTemplate ? customerTemplate.split("|") : customerTemplate;
		},
		getPreference: function () {

			return customerPreference;
			//return customerPreference.data[0];
		},
		setPreference: function (data) {
			customerPreference = data;
		},
		getFundData: function () {

			return fundData;
			//return customerPreference.data[0];
		},
		setFundData: function (data) {
			fundData = data;
		},
		getBaseURL: function () {
			return baseURL;
		},
		getMeetingTypeList: function () {
			return meetingTypeList;
		},
		setMeetingTypeList: function (data) {
			meetingTypeList = data;
		},
		getVotedYNList: function () {
			return votedYNList;
		},
		setVotedYNList: function (data) {
			votedYNList = data;
		},
		getvoteCastAgainstMgmt: function () {
			return voteCastAgainstMgmt;
		},
		setvoteCastAgainstMgmt: function (data) {

			data = data[0];
			var totalVoteCast = data.against + data.For;

			voteCastAgainstMgmt.againstPercent = totalVoteCast > 0 ? Math.round(((data.against / totalVoteCast) * 100)) : 0;
			if (totalVoteCast == 0) {
				voteCastAgainstMgmt.forPercent = 0;
			}
			else {
				voteCastAgainstMgmt.forPercent = 100 - voteCastAgainstMgmt.againstPercent;
			}

			voteCastAgainstMgmt.For = data.For;
			voteCastAgainstMgmt.against = data.against;
			//voteCastAgainstMgmt = data;
		},
		getindustryPercentage: function () {
			return industryPercentage;
		},
		setindustryPercentage: function (data) {

			//console.log("industry Data  : " + JSON.stringify(data));

			var totalMeetings = 0;
			var count1 = 0;
			var setKey = 0, j;
			j = 0
			angular.forEach(data, function (value, index) {
				totalMeetings = totalMeetings + parseInt(value.value);
				if (count1 != 1) {
					count1 = countValSector(data, value.value);
					if (count1 == 1)
						setKey = j;
				}
				j++;
			});
			//console.log(totalMeetings);

			function countValSector(meetingTypeData, val) {
				var count = 0;
				for (var i = 0; i < meetingTypeData.length; ++i) {
					if (meetingTypeData[i].value == val)
						count++;
				}
				return count;
			}
			var treeData = {
				name: "tree"
			};
			treeData.children = [];
			var domain = [];
			var percentTotal = 0;
			var tempPrevMeetingCount = 0;
			//@TODO : calculate the percentage from the meeting count.
			var erro = 0;
			var flagError = 0;
			var objPercent = 0;
			var i = 0;
			angular.forEach(data, function (value, key) {
				var obj = {};

				obj.percent = ((value.value / totalMeetings) * 100).toFixed(1);//parseFloat(value.value).toFixed(1);
				objPercent = ((value.value / totalMeetings) * 100);
				erro += objPercent - objPercent.toFixed(1);
				percentTotal = (parseFloat(percentTotal) + parseFloat(obj.percent)).toFixed(1);
				domain.push(parseFloat(obj.percent));
				if (parseFloat(obj.percent) < 1) {
					obj.value = (tempPrevMeetingCount - Math.round((tempPrevMeetingCount - value.value) / 2))
				}
				else {
					obj.value = value.value;
				}
				// obj.value = parseFloat(obj.percent) < 1 ? (tempPrevMeetingCount-Math.round((tempPrevMeetingCount - value.value)/2)) : value.value;
				tempPrevMeetingCount = obj.value;
				obj.meetingCount = value.value;
				obj.id = value.id;
				obj.sectorId = value.sectorId;
				//obj.value = value.percent > 1 ? value.percent : 1;
				//var test  = iconImageMapping(value.id.replace(/\s/g, ''));
				// console.log(iconImageMapping(value.id.replace(/\s/g, '')));
				//obj.img = value.id.replace(/\s/g, '') +".png";
				obj.img = iconImageMapping(value.id.replace(/\s/g, ''));
				//	 obj.absolute = percent >= 1 ? false : true;
				i++;
				this.push(obj);
			}, treeData.children);

			if (erro != 0) {
				treeData.children[setKey].percent = parseFloat(treeData.children[setKey].percent) + erro;
				//treeData.children[setKey].percent = parseFloat(treeData.children[setKey].percent);
				treeData.children[setKey].percent = parseFloat(treeData.children[setKey].percent).toFixed(1);
			}

			treeData.children.sort(propComparator('value'));

			//	console.log("treedata : " + JSON.stringify(treeData.children));

			//treeData.children[0].percent = percentageRounding(percentTotal,treeData.children[0].percent);
			industryPercentage.data = treeData;
			domain.sort(function (a, b) { return a - b });
			industryPercentage.domain = domain;

			industryPercentage.maxMeetingCount = treeData.children[0];
			industryPercentage.minMeetingCount = treeData.children[treeData.children.length - 1];

			//console.log(JSON.stringify(industryPercentage));

			/*	industryPercentage.data = {"name":"tree","children":[{"percent":"19.3","value":141,"id":"Consumer Discretionary","img":"vds-consumerdiscretionary"},
												   {"percent":"17.7","value":130,"id":"Industrials","img":"vds-industrials"},
												   {"percent":"16.8","value":123,"id":"Information Technology","img":"vds-informationtechnology"},
												   {"percent":"15.3","value":112,"id":"Financials","img":"vds-financial"},
												   {"percent":"9.0","value":66,"id":"Health Care","img":"vds-healthcare"},
												   {"percent":"8.7","value":64,"id":"Materials","img":"vds-materials"},
												   {"percent":"5.3","value":39,"id":"Consumer Staples","img":"vds-consumerstaples"},
												   {"percent":"4.1","value":30,"id":"Energy","img":"vds-energy"},
												   {"percent":"3.7","value":27,"id":"Utilities","img":"vds-utilities"},
												   {"percent":"0.1","value":10,"id":"Telecommunication Services","img":"vds-telecomservices"}]};
				
				 industryPercentage.domain = [0.1,3.7,4.1,5.3,8.7,9,15.3,16.8,17.7,19.2];
				 industryPercentage.maxMeetingCount = {"percent":"19.3","value":141,"id":"Consumer Discretionary","img":"vds-consumerdiscretionary"};
				 industryPercentage.minMeetingCount = {"percent":"0.1","value":1,"id":"Telecommunication Services","img":"vds-telecomservices"};*/


		},
		getvotingStatistics: function () {
			return votingStatistics;
		},
		setvotingStatistics: function (data) {

			//industryPercentage.data = treeData;
        	/*votingStatistics = {[
                      			  ['', '', { role: 'style' }],
                   			  ['For', 270500],
                   			  ['Against/WithHold', 117000],
                   			  ['Abstain', 80000],
                   			  ['Did Not Vote', 35000],
                   			  ['2 Years', 1000],
                   			  ['TEst', 100000],
                   			  ['TEst1', 200000],
                   			  ['TEst2', 400000] ]}; */

			votingStatistics = data;


		},
		getvotingCastProposalCategory: function () {
			return votingCastProposalCategory;
		},
		setvotingCastProposalCategory: function (data) {

			//industryPercentage.data = treeData;
        	/*votingStatistics = {[
                      			  ['', '', { role: 'style' }],
                   			  ['For', 270500],
                   			  ['Against/WithHold', 117000],
                   			  ['Abstain', 80000],
                   			  ['Did Not Vote', 35000],
                   			  ['2 Years', 1000],
                   			  ['TEst', 100000],
                   			  ['TEst1', 200000],
                   			  ['TEst2', 400000] ]}; */

			votingCastProposalCategory = data;


		},
		getvotingCastAlignMgmtProposalCategory: function () {
			return votingCastAlignMgmtProposalCategory;
		},
		setvotingCastAlignMgmtProposalCategory: function (data) {
			votingCastAlignMgmtProposalCategory = data;
		},
		getmeetingTypeUI: function () {
			return meetingTypeUI;
		},
		setmeetingTypeUI: function (data) {
			//console.log(data);	
			//Dummy Data
        	/*data = [{"id":"Annual","value":3992},{"id":"Annual/Special","value":342},
        	        {"id":"Court","value":25},
					{"id":"Debenture Holder","value":1},
        	        {"id":"Proxy Contest","value":3},
        	        {"id":"Special","value":943},
					{"id":"Written consent","value":2},
        	        {"id":"Voted","value":4607},
        	        {"id":"Unvoted","value":701}];*/
        	/*data = [{"id":"Annual","value":1391},{"id":"Annual/Special","value":103},
        	        {"id":"Court","value":3},
        	        {"id":"Proxy Contest","value":1},
        	        {"id":"Special","value":233},
        	        {"id":"Voted","value":1331},
        	        {"id":"Unvoted","value":400}];*/
        	/*data = [{"id":"Annual","value":2},{"id":"Annual/Special","value":1},
        	        {"id":"Voted","value":2},
        	        {"id":"Unvoted","value":1}];*/
			var totalMeetings = 0;
			var unVoted = 0;
			var voted = 0;
			var meetingTypeData = [];
			// identify the totalMeetings count to calculate the percentage
			angular.forEach(data, function (value) {
				//@TODO : move to static JSON
				if (value.id == "Voted") {
					//console.log(value.id + " : " + value.value);
					voted = value.value;
				}
				else if (value.id == "Unvoted") {
					//console.log(value.id + " : " + value.value);
					unVoted = value.value;
				}
				else {
					meetingTypeData.push(value)
				}

			});

			totalMeetings = voted + unVoted;
			meetingTypeUI.data = [];

			meetingTypeData.sort(propComparator('value'));

			var percentTotal = 0;
			var previousMeetingGroup = totalMeetings;
			// Construct the MeetingTypeUI object with the percentage values
			//console.log(meetingTypeData);
			angular.forEach(meetingTypeData, function (value, key) {

				value.percent = ((value.value / totalMeetings) * 100).toFixed(1);
				percentTotal = (parseFloat(percentTotal) + parseFloat(value.percent)).toFixed(1);
				value.meetingsCount = value.value;
				if (totalMeetings > 500)
					value.value = (value.value < (totalMeetings / (totalMeetings / (meetingTypeData.length * 2)))) ? value.value + (totalMeetings / (totalMeetings / (meetingTypeData.length * 2))) : value.value;
				else
					value.value = value.value < (totalMeetings / 200) ? value.value * (totalMeetings / 200) : value.value;
				value.value = (value.value < previousMeetingGroup) ? value.value : (previousMeetingGroup - (value.value - previousMeetingGroup));

				//if(value.value <=0 && meetingTypeData.length > 6)
				if (value.value <= 0)	//if above processing give -ve value, set it to a +ve number
				{
					value.value = 2;
				}

				previousMeetingGroup = value.value;
				meetingTypeUI.data.push(value);

			});
			/******* For Adjustment of 100% ******/
			var erro = 0;
			var flagError = 0;
			var percentRounded = 0;
			for (i = 0; i < meetingTypeData.length; i++) {
				var percentVal = ((meetingTypeData[i].meetingsCount / totalMeetings) * 100);
				percentRounded = percentVal.toFixed(1);
				erro += percentRounded - percentVal;
				if (percentRounded == 0)
					flagError = 1;
				//console.log(meetingTypeData[i].meetingsCount,totalMeetings,percentVal,percentRounded,erro);
			}
			var pctval;
			for (var i = 0; i < meetingTypeData.length; ++i) {
				var countisone = countValues(meetingTypeData, meetingTypeData[i].meetingsCount);
				if (countisone == 1) {
					//console.log(meetingTypeData[i].meetingsCount,i,'break',meetingTypeData[i].percent,parseFloat(meetingTypeData[i].percent)-parseFloat(erro));
					pctval = parseFloat(meetingTypeData[i].percent) - (parseFloat(erro));
					meetingTypeData[i].percent = pctval.toFixed(1);
					if (flagError == 1)
						meetingTypeData[i].percent = (meetingTypeData[i].percent - 0.1).toFixed(1);
					//console.log(flagError+'set6 me breka free '+ meetingTypeData[i].percent);
					break;
				}
			}

			function countValues(meetingTypeData, val) {
				var count = 0;
				for (var i = 0; i < meetingTypeData.length; ++i) {
					if (meetingTypeData[i].meetingsCount == val)
						count++;
				}
				return count;
			}
			/******* For Adjustment of 100% ends*******/
			//Sort the result by percentage values	
			meetingTypeUI.data.sort(propComparator('percent'));
			//meetingTypeUI.data.sort(compare);

			// Sum of the meeting type % should be 100. 
			//@Note : The sum could be lessthen or grater then 100 because of 1 decimal rounding. Add/Sub the difference to the meeting type with maximum percentage
			//var maxMeetingType = parseFloat(meetingTypeUI.data[0].percent);
			//meetingTypeUI.data[0].percent = percentTotal > 100 ? (maxMeetingType - (percentTotal - 100)).toFixed(1) : percentTotal == 100 ? maxMeetingType : (maxMeetingType + (100 - percentTotal)).toFixed(1); 
			//meetingTypeUI.data[0].percent = percentageRounding(percentTotal,meetingTypeUI.data[0].percent);

			meetingTypeUI.totalMeetings = totalMeetings;
			meetingTypeUI.unVoted = unVoted;
			meetingTypeUI.voted = voted;
		},
		getmeetingByMarket: function () {
			return meetingByMarket;
		},
		setmeetingByMarket: function (data) {

			//@TODO : Need to be removed. Should be returned from the SP
			/* data =  [{ "CountryName":"USA","MeetingCount":"30","Latitude":"37.090240","CountryId":"9","ColorCode" : 1,"Longitude": "-95.712890"},                                 
									  { "CountryName":"United Kingdom","MeetingCount":"30","Latitude":"55.378050","CountryId":"10","ColorCode" : 2,"Longitude":"-3.435973"},
									  { "CountryName":"Canada","MeetingCount":"10","Latitude":"56.130370","CountryId":"11","ColorCode" : 3,"Longitude":"-106.346800"},
									  { "CountryName":"France","MeetingCount":"10","Latitude":"46.227640","CountryId":"13","ColorCode" : 4,"Longitude":"2.213749"},
									  { "CountryName":"Germany","MeetingCount":"8","Latitude":"51.165690","CountryId":"14","ColorCode" : 5,"Longitude":"10.451530"},
									  { "CountryName":"India","MeetingCount":"6","Latitude":"20.593680","CountryId":"251","ColorCode" : 6,"Longitude":"78.962880"},
									  { "CountryName":"Japan","MeetingCount":"6","Latitude":"36.204820","CountryId":"16","ColorCode" : 6,"Longitude":"138.252900"}];*/

			/*data = 	[  
					  {  
				  "CountryID":"1210 ",
				  "MeetingCount":"1",
				  "CountryName":"Jersey",
				  "Latitude":"50.1900",
				  "id":"32",
				  "Longitude":"-2.11"
			   },
			   {  
				  "CountryID":"1212 ",
				  "MeetingCount":"1",
				  "CountryName":"Guernsey",
				  "Latitude":"49.45",
				  "id":" 49",
				  "Longitude":"-2.55"
			   },
			   {  
				  "CountryID":"252",
				  "MeetingCount":"1",
				  "CountryName":"Piy",
				  "Latitude":"49.45",
				  "id":" 49",
				  "Longitude":"20.55"
			   }
			];*/
			var totalMeetings = 0;
			var legendData = [];
			angular.forEach(data, function (value, index) {

				value.ColorCode = index + 1;
				totalMeetings = totalMeetings + parseInt(value.MeetingCount);

			});

			var keepGoing = true;
			var top5MeetingCount = 0;
			var percentTotal = 0;
			var errFactor = 0;
			var pctVar = 0;
			var countVar = 0;
			angular.forEach(data, function (value) {
				countVar++;
				if (keepGoing) {
					var obj = {};
					obj.ColorCode = value.ColorCode;
					//	obj.CountryName = 'Other';

					if (value.ColorCode == 6) {
						obj.CountryName = 'Other';
						pctVar = (((totalMeetings - top5MeetingCount) / totalMeetings) * 100);
						obj.percent = pctVar.toFixed(1);
						errFactor += (pctVar.toFixed(1) - pctVar);
						percentTotal = (parseFloat(percentTotal) + parseFloat(obj.percent)).toFixed(1);
						obj.percent = (obj.percent - errFactor).toFixed(1);
						obj.MeetinNum = parseInt((totalMeetings - top5MeetingCount));
						//console.log(pctVar,obj.percent,(pctVar.toFixed(1) - pctVar),errFactor);
						//@Note : The sum could be lessthen or grater then 100 because of 1 decimal rounding. Add/Sub the difference to the meeting type with other group percentage
						//obj.percent = percentTotal > 100 ? (obj.percent - (percentTotal - 100)).toFixed(1) : percentTotal == 100 ? obj.percent : (obj.percent + (100 - percentTotal)).toFixed(1);
						//obj.percent =  percentageRounding(percentTotal,obj.percent);
						keepGoing = false;
					}
					else {
						obj.CountryName = value.CountryName;
						top5MeetingCount = top5MeetingCount + parseInt(value.MeetingCount);
						pctVar = ((value.MeetingCount / totalMeetings) * 100);
						errFactor += (pctVar.toFixed(1) - pctVar);
						obj.percent = pctVar.toFixed(1);
						obj.MeetinNum = parseInt(value.MeetingCount);
						percentTotal = (parseFloat(percentTotal) + parseFloat(obj.percent)).toFixed(1);
						//console.log(pctVar,obj.percent,(pctVar.toFixed(1) - pctVar),errFactor);
						if (data.length == countVar) {
							obj.percent = (obj.percent - errFactor).toFixed(1);
						}
					}
					legendData.push(obj);
				}

				//	obj.percent = ((value.MeetingCount/totalMeetings)*100).toFixed(1);



			});
			meetingByMarket.data = data;



			meetingByMarket.data.sort(propComparator('MeetingCount'));

			//meetingByMarket.data.sort(compare1);

			//sortArrOfObjectsByParam(meetingByMarket.data, 'MeetingCount');

			//	console.log("max market : "+meetingByMarket.data[0].CountryName);
			//	console.log("min market : "+meetingByMarket.data[meetingByMarket.data.length-1].CountryName);

			meetingByMarket.legendData = legendData;
			meetingByMarket.totalMeetings = totalMeetings;
			meetingByMarket.maxMeetingCount = meetingByMarket.data[0];
			meetingByMarket.minMeetingCount = meetingByMarket.data[meetingByMarket.data.length - 1];
			var maxMeetingCountCountryName = '';
			if(meetingByMarket.maxMeetingCount.Prefix == true)
			{
				if(PreferLanguageProperties.CountryList!=undefined && PreferLanguageProperties.CountryList[meetingByMarket.maxMeetingCount.CountryName]!=undefined){
          maxMeetingCountCountryName = PreferLanguageProperties.CountryList[meetingByMarket.maxMeetingCount.CountryName];				  
				}
        else if(PreferLanguageProperties.the!=undefined){
          maxMeetingCountCountryName = PreferLanguageProperties.the + vdsAppHelper.getLangProperty(meetingByMarket.maxMeetingCount.CountryName);	
				}else{
				  maxMeetingCountCountryName = 'the '+ vdsAppHelper.getLangProperty(meetingByMarket.maxMeetingCount.CountryName);	
				}	
			}
			else{
				maxMeetingCountCountryName = vdsAppHelper.getLangProperty(meetingByMarket.maxMeetingCount.CountryName);
			}
			meetingByMarket.maxMeetingCountCountryName = maxMeetingCountCountryName;
			var minMeetingCountCountryName = '';
			if(meetingByMarket.minMeetingCount.Prefix == true)
			{
				if( PreferLanguageProperties.CountryList!=undefined && PreferLanguageProperties.CountryList[meetingByMarket.minMeetingCount.CountryName]!=undefined){
				  minMeetingCountCountryName = PreferLanguageProperties.CountryList[meetingByMarket.minMeetingCount.CountryName];	
				}else if(PreferLanguageProperties.the!=undefined){
          minMeetingCountCountryName = PreferLanguageProperties.the + vdsAppHelper.getLangProperty(meetingByMarket.minMeetingCount.CountryName);
				}else{
				  minMeetingCountCountryName = 'the '+ vdsAppHelper.getLangProperty(meetingByMarket.minMeetingCount.CountryName);
				}	
			}
			else{
				minMeetingCountCountryName = vdsAppHelper.getLangProperty(meetingByMarket.minMeetingCount.CountryName);
			}
			meetingByMarket.minMeetingCountCountryName = minMeetingCountCountryName;

		},
		getStandardFreeText: function () {
			return standardFreeText;
		},
		setStandardFreeText: function (data) {
			standardFreeText = data;
		},
		getCSSJSVersion: function () {
			return CSSJSVersion;
		},
		setCSSJSVersion: function (data) {
			CSSJSVersion = data;
		},
		getVDSComponentsJSON: function () {
			return VDSComponentsJSON;
		},
		setVDSComponentsJSON: function (data) {
			VDSComponentsJSON = data;
		},
		getDashboardProperties: function () {
			return DashboardProperties;
		},
		setDashboardProperties: function (data) {
			DashboardProperties = data;
		},
		getCustomProperties: function () {
			return CustomProperties;
		},
		setCustomProperties: function (data) {
			CustomProperties = data;
		},
		getPreferLanguageProperties : function () {
			return PreferLanguageProperties;
		},
		setPreferLanguageProperties : function(data) {
			PreferLanguageProperties = data;
		},
		getCommonOrCustomLanguage : function () {
			return CommonOrCustomLanguage;
		},
		setCommonOrCustomLanguage : function(data) {
			CommonOrCustomLanguage = data;
		},
		isLiveSite: function () {
			return isLiveSite;
		},
		getRepoDirectory: function () {
			if (this.isLiveSite() == 1)	//live site
			{
				return this.getVDSComponentsJSON().repoDirectoryLive;
			}
			else	//staging site
			{
				return this.getVDSComponentsJSON().repoDirectoryStaging;
			}
		},

		getHeatMapSelected: function() {
			return isHeatSelected;
		},

		setHeatMapSelected: function(data) {
			isHeatSelected = data;
		},

		getgraphSectionSelected: function() {
			return graphSectionSelected;
		},

		setgraphSectionSelected: function(data) {
			graphSectionSelected = data;
		},

		getlanguageUse: function() {
			return languageUse;
		},

		setlanguageUse : function(data){
			languageUse =  data;
		}

	};

	return Rest;

});
'use strict';

(function () {

    /**
     * @ngdoc overview
     * @name ngStorage
     */

	angular.module('ngStorage', []).

		/**
		 * @ngdoc object
		 * @name ngStorage.$localStorage
		 * @requires $rootScope
		 * @requires $window
		 */

		factory('$localStorage', _storageFactory('localStorage')).

		/**
		 * @ngdoc object
		 * @name ngStorage.$sessionStorage
		 * @requires $rootScope
		 * @requires $window
		 */

		factory('$sessionStorage', _storageFactory('sessionStorage'));

	function _storageFactory(storageType) {
		return [
			'$rootScope',
			'$window',
			'$log',

			function (
				$rootScope,
				$window,
				$log
			) {
				// #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
				var webStorage = $window[storageType] || ($log.warn('This browser does not support Web Storage!'), {}),
					$storage = {
						$default: function (items) {
							for (var k in items) {
								angular.isDefined($storage[k]) || ($storage[k] = items[k]);
							}

							return $storage;
						},
						$reset: function (items) {
							for (var k in $storage) {
								'$' === k[0] || delete $storage[k];
							}

							return $storage.$default(items);
						}
					},
					_last$storage,
					_debounce;

				for (var i = 0, k; i < webStorage.length; i++) {
					// #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
					(k = webStorage.key(i)) && 'ngStorage-' === k.slice(0, 10) && ($storage[k.slice(10)] = angular.fromJson(webStorage.getItem(k)));
				}

				_last$storage = angular.copy($storage);

				$rootScope.$watch(function () {
					_debounce || (_debounce = setTimeout(function () {
						_debounce = null;

						if (!angular.equals($storage, _last$storage)) {
							angular.forEach($storage, function (v, k) {
								angular.isDefined(v) && '$' !== k[0] && webStorage.setItem('ngStorage-' + k, angular.toJson(v));

								delete _last$storage[k];
							});

							for (var k in _last$storage) {
								webStorage.removeItem('ngStorage-' + k);
							}

							_last$storage = angular.copy($storage);
						}
					}, 100));
				});

				// #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
				'localStorage' === storageType && $window.addEventListener && $window.addEventListener('storage', function (event) {
					if ('ngStorage-' === event.key.slice(0, 10)) {
						event.newValue ? $storage[event.key.slice(10)] = angular.fromJson(event.newValue) : delete $storage[event.key.slice(10)];

						_last$storage = angular.copy($storage);

						$rootScope.$apply();
					}
				});

				return $storage;
			}
		];
	}

})();

vdsApp.service('LazyDirectiveLoader', ['$rootScope', '$q', '$compile', function ($rootScope, $q, $compile) {

	var _directivesLoaded = [];

	var _load = function (directiveName, directiveFile) {
		// make sure the directive exists in the mapper
		if (!directiveFile) {
			console.log('Error: Cant find directive in mapper : ' + directiveName);
			return;
		}

		var deferred = $q.defer();

		// check if we loaded this directive already
		if (_directivesLoaded.indexOf(directiveName) >= 0) {
			deferred.resolve();
			return deferred.promise;
		}

		// Load the directive javascript file we need
		// TODO: export this part to a separate service
		var script = document.createElement('script');
		script.src = directiveFile;
		script.onload = function () {
			//   _modulesLoaded.push(directiveFileName);
			$rootScope.$apply(deferred.resolve);
		};
		document.getElementsByTagName('head')[0].appendChild(script);

		return deferred.promise;
	};

	return {
		load: _load
	};

}]);
!function (a) {
	"use strict"; function b(a) { this.owner = a } function c(a, b) { if (Object.create) b.prototype = Object.create(a.prototype); else { var c = function () { }; c.prototype = a.prototype, b.prototype = new c } return b.prototype.constructor = b, b } function d(a) { var b = this.internal = new e(this); b.loadConfig(a), b.init(), function c(a, b, d) { Object.keys(a).forEach(function (e) { b[e] = a[e].bind(d), Object.keys(a[e]).length > 0 && c(a[e], b[e], d) }) }(h, this, this) } function e(b) { var c = this; c.d3 = a.d3 ? a.d3 : "undefined" != typeof require ? require("d3") : void 0, c.api = b, c.config = c.getDefaultConfig(), c.data = {}, c.cache = {}, c.axes = {} } function f(a) { b.call(this, a) } function g(a, b) { function c(a, b) { a.attr("transform", function (a) { return "translate(" + Math.ceil(b(a) + u) + ", 0)" }) } function d(a, b) { a.attr("transform", function (a) { return "translate(0," + Math.ceil(b(a)) + ")" }) } function e(a) { var b = a[0], c = a[a.length - 1]; return c > b ? [b, c] : [c, b] } function f(a) { var b, c, d = []; if (a.ticks) return a.ticks.apply(a, n); for (c = a.domain(), b = Math.ceil(c[0]); b < c[1]; b++)d.push(b); return d.length > 0 && d[0] > 0 && d.unshift(d[0] - (d[1] - d[0])), d } function g() { var a, c = p.copy(); return b.isCategory && (a = p.domain(), c.domain([a[0], a[1] - 1])), c } function h(a) { var b = m ? m(a) : a; return "undefined" != typeof b ? b : "" } function i(a) { if (z) return z; var b = { h: 11.5, w: 5.5 }; return a.select("text").text(h).each(function (a) { var c = this.getBoundingClientRect(), d = h(a), e = c.height, f = d ? c.width / d.length : void 0; e && f && (b.h = e, b.w = f) }).text(""), z = b, b } function j(c) { return b.withoutTransition ? c : a.transition(c) } function k(m) { m.each(function () { function m(a, c) { function d(a, b) { f = void 0; for (var h = 1; h < b.length; h++)if (" " === b.charAt(h) && (f = h), e = b.substr(0, h + 1), g = U.w * e.length, g > c) return d(a.concat(b.substr(0, f ? f : h)), b.slice(f ? f + 1 : h)); return a.concat(b) } var e, f, g, i = h(a), j = []; return "[object Array]" === Object.prototype.toString.call(i) ? i : ((!c || 0 >= c) && (c = X ? 95 : b.isCategory ? Math.ceil(F(G[1]) - F(G[0])) - 12 : 110), d(j, i + "")) } function n(a, b) { var c = U.h; return 0 === b && (c = "left" === q || "right" === q ? -((V[a.index] - 1) * (U.h / 2) - 3) : ".71em"), c } function v(a) { var b = p(a) + (o ? 0 : u); return L[0] < b && b < L[1] ? r : 0 } function w(a) { return a ? a > 0 ? "start" : "end" : "middle" } function x(a) { return a ? "rotate(" + a + ")" : "" } function y(a) { return a ? 8 * Math.sin(Math.PI * (a / 180)) : 0 } function z(a) { return a ? 11.5 - 2.5 * (a / 15) * (a > 0 ? 1 : -1) : W } var A, B, C, D = k.g = a.select(this), E = this.__chart__ || p, F = this.__chart__ = g(), G = t ? t : f(F), H = D.selectAll(".tick").data(G, F), I = H.enter().insert("g", ".domain").attr("class", "tick").style("opacity", 1e-6), J = H.exit().remove(), K = j(H).style("opacity", 1), L = p.rangeExtent ? p.rangeExtent() : e(p.range()), M = D.selectAll(".domain").data([0]), N = (M.enter().append("path").attr("class", "domain"), j(M)); I.append("line"), I.append("text"); var O = I.select("line"), P = K.select("line"), Q = I.select("text"), R = K.select("text"); b.isCategory ? (u = Math.ceil((F(1) - F(0)) / 2), B = o ? 0 : u, C = o ? u : 0) : u = B = 0; var S, T, U = i(D.select(".tick")), V = [], W = Math.max(r, 0) + s, X = "left" === q || "right" === q; S = H.select("text"), T = S.selectAll("tspan").data(function (a, c) { var d = b.tickMultiline ? m(a, b.tickWidth) : [].concat(h(a)); return V[c] = d.length, d.map(function (a) { return { index: c, splitted: a } }) }), T.enter().append("tspan"), T.exit().remove(), T.text(function (a) { return a.splitted }); var Y = b.tickTextRotate; switch (q) { case "bottom": A = c, O.attr("y2", r), Q.attr("y", W), P.attr("x1", B).attr("x2", B).attr("y2", v), R.attr("x", 0).attr("y", z(Y)).style("text-anchor", w(Y)).attr("transform", x(Y)), T.attr("x", 0).attr("dy", n).attr("dx", y(Y)), N.attr("d", "M" + L[0] + "," + l + "V0H" + L[1] + "V" + l); break; case "top": A = c, O.attr("y2", -r), Q.attr("y", -W), P.attr("x2", 0).attr("y2", -r), R.attr("x", 0).attr("y", -W), S.style("text-anchor", "middle"), T.attr("x", 0).attr("dy", "0em"), N.attr("d", "M" + L[0] + "," + -l + "V0H" + L[1] + "V" + -l); break; case "left": A = d, O.attr("x2", -r), Q.attr("x", -W), P.attr("x2", -r).attr("y1", C).attr("y2", C), R.attr("x", -W).attr("y", u), S.style("text-anchor", "end"), T.attr("x", -W).attr("dy", n), N.attr("d", "M" + -l + "," + L[0] + "H0V" + L[1] + "H" + -l); break; case "right": A = d, O.attr("x2", r), Q.attr("x", W), P.attr("x2", r).attr("y2", 0), R.attr("x", W).attr("y", 0), S.style("text-anchor", "start"), T.attr("x", W).attr("dy", n), N.attr("d", "M" + l + "," + L[0] + "H0V" + L[1] + "H" + l) }if (F.rangeBand) { var Z = F, $ = Z.rangeBand() / 2; E = F = function (a) { return Z(a) + $ } } else E.rangeBand ? E = F : J.call(A, F); I.call(A, E), K.call(A, F) }) } var l, m, n, o, p = a.scale.linear(), q = "bottom", r = 6, s = 3, t = null, u = 0, v = !0; return b = b || {}, l = b.withOuterTick ? 6 : 0, k.scale = function (a) { return arguments.length ? (p = a, k) : p }, k.orient = function (a) { return arguments.length ? (q = a in { top: 1, right: 1, bottom: 1, left: 1 } ? a + "" : "bottom", k) : q }, k.tickFormat = function (a) { return arguments.length ? (m = a, k) : m }, k.tickCentered = function (a) { return arguments.length ? (o = a, k) : o }, k.tickOffset = function () { return u }, k.tickInterval = function () { var a, c; return b.isCategory ? a = 2 * u : (c = k.g.select("path.domain").node().getTotalLength() - 2 * l, a = c / k.g.selectAll("line").size()), 1 / 0 === a ? 0 : a }, k.ticks = function () { return arguments.length ? (n = arguments, k) : n }, k.tickCulling = function (a) { return arguments.length ? (v = a, k) : v }, k.tickValues = function (a) { if ("function" == typeof a) t = function () { return a(p.domain()) }; else { if (!arguments.length) return t; t = a } return k }, k } var h, i, j, k = { version: "0.4.10" }; k.generate = function (a) { return new d(a) }, k.chart = { fn: d.prototype, internal: { fn: e.prototype, axis: { fn: f.prototype } } }, h = k.chart.fn, i = k.chart.internal.fn, j = k.chart.internal.axis.fn, i.init = function () { var a = this, b = a.config; if (a.initParams(), b.data_url) a.convertUrlToData(b.data_url, b.data_mimeType, b.data_keys, a.initWithData); else if (b.data_json) a.initWithData(a.convertJsonToData(b.data_json, b.data_keys)); else if (b.data_rows) a.initWithData(a.convertRowsToData(b.data_rows)); else { if (!b.data_columns) throw Error("url or json or rows or columns is required."); a.initWithData(a.convertColumnsToData(b.data_columns)) } }, i.initParams = function () { var a = this, b = a.d3, c = a.config; a.clipId = "c3-" + +new Date + "-clip", a.clipIdForXAxis = a.clipId + "-xaxis", a.clipIdForYAxis = a.clipId + "-yaxis", a.clipIdForGrid = a.clipId + "-grid", a.clipIdForSubchart = a.clipId + "-subchart", a.clipPath = a.getClipPath(a.clipId), a.clipPathForXAxis = a.getClipPath(a.clipIdForXAxis), a.clipPathForYAxis = a.getClipPath(a.clipIdForYAxis), a.clipPathForGrid = a.getClipPath(a.clipIdForGrid), a.clipPathForSubchart = a.getClipPath(a.clipIdForSubchart), a.dragStart = null, a.dragging = !1, a.flowing = !1, a.cancelClick = !1, a.mouseover = !1, a.transiting = !1, a.color = a.generateColor(), a.levelColor = a.generateLevelColor(), a.dataTimeFormat = c.data_xLocaltime ? b.time.format : b.time.format.utc, a.axisTimeFormat = c.axis_x_localtime ? b.time.format : b.time.format.utc, a.defaultAxisTimeFormat = a.axisTimeFormat.multi([[".%L", function (a) { return a.getMilliseconds() }], [":%S", function (a) { return a.getSeconds() }], ["%I:%M", function (a) { return a.getMinutes() }], ["%I %p", function (a) { return a.getHours() }], ["%-m/%-d", function (a) { return a.getDay() && 1 !== a.getDate() }], ["%-m/%-d", function (a) { return 1 !== a.getDate() }], ["%-m/%-d", function (a) { return a.getMonth() }], ["%Y/%-m/%-d", function () { return !0 }]]), a.hiddenTargetIds = [], a.hiddenLegendIds = [], a.focusedTargetIds = [], a.defocusedTargetIds = [], a.xOrient = c.axis_rotated ? "left" : "bottom", a.yOrient = c.axis_rotated ? c.axis_y_inner ? "top" : "bottom" : c.axis_y_inner ? "right" : "left", a.y2Orient = c.axis_rotated ? c.axis_y2_inner ? "bottom" : "top" : c.axis_y2_inner ? "left" : "right", a.subXOrient = c.axis_rotated ? "left" : "bottom", a.isLegendRight = "right" === c.legend_position, a.isLegendInset = "inset" === c.legend_position, a.isLegendTop = "top-left" === c.legend_inset_anchor || "top-right" === c.legend_inset_anchor, a.isLegendLeft = "top-left" === c.legend_inset_anchor || "bottom-left" === c.legend_inset_anchor, a.legendStep = 0, a.legendItemWidth = 0, a.legendItemHeight = 0, a.currentMaxTickWidths = { x: 0, y: 0, y2: 0 }, a.rotated_padding_left = 30, a.rotated_padding_right = c.axis_rotated && !c.axis_x_show ? 0 : 30, a.rotated_padding_top = 5, a.withoutFadeIn = {}, a.intervalForObserveInserted = void 0, a.axes.subx = b.selectAll([]) }, i.initChartElements = function () { this.initBar && this.initBar(), this.initLine && this.initLine(), this.initArc && this.initArc(), this.initGauge && this.initGauge(), this.initText && this.initText() }, i.initWithData = function (b) { var c, d, e = this, g = e.d3, h = e.config, i = !0; e.axis = new f(e), e.initPie && e.initPie(), e.initBrush && e.initBrush(), e.initZoom && e.initZoom(), e.selectChart = h.bindto ? "function" == typeof h.bindto.node ? h.bindto : g.select(h.bindto) : g.selectAll([]), e.selectChart.empty() && (e.selectChart = g.select(document.createElement("div")).style("opacity", 0), e.observeInserted(e.selectChart), i = !1), e.selectChart.html("").classed("c3", !0), e.data.xs = {}, e.data.targets = e.convertDataToTargets(b), h.data_filter && (e.data.targets = e.data.targets.filter(h.data_filter)), h.data_hide && e.addHiddenTargetIds(h.data_hide === !0 ? e.mapToIds(e.data.targets) : h.data_hide), h.legend_hide && e.addHiddenLegendIds(h.legend_hide === !0 ? e.mapToIds(e.data.targets) : h.legend_hide), e.hasType("gauge") && (h.legend_show = !1), e.updateSizes(), e.updateScales(), e.x.domain(g.extent(e.getXDomain(e.data.targets))), e.y.domain(e.getYDomain(e.data.targets, "y")), e.y2.domain(e.getYDomain(e.data.targets, "y2")), e.subX.domain(e.x.domain()), e.subY.domain(e.y.domain()), e.subY2.domain(e.y2.domain()), e.orgXDomain = e.x.domain(), e.brush && e.brush.scale(e.subX), h.zoom_enabled && e.zoom.scale(e.x), e.svg = e.selectChart.append("svg").style("overflow", "hidden").on("mouseenter", function () { return h.onmouseover.call(e) }).on("mouseleave", function () { return h.onmouseout.call(e) }), c = e.svg.append("defs"), e.clipChart = e.appendClip(c, e.clipId), e.clipXAxis = e.appendClip(c, e.clipIdForXAxis), e.clipYAxis = e.appendClip(c, e.clipIdForYAxis), e.clipGrid = e.appendClip(c, e.clipIdForGrid), e.clipSubchart = e.appendClip(c, e.clipIdForSubchart), e.updateSvgSize(), d = e.main = e.svg.append("g").attr("transform", e.getTranslate("main")), e.initSubchart && e.initSubchart(), e.initTooltip && e.initTooltip(), e.initLegend && e.initLegend(), d.append("text").attr("class", l.text + " " + l.empty).attr("text-anchor", "middle").attr("dominant-baseline", "middle"), e.initRegion(), e.initGrid(), d.append("g").attr("clip-path", e.clipPath).attr("class", l.chart), h.grid_lines_front && e.initGridLines(), e.initEventRect(), e.initChartElements(), d.insert("rect", h.zoom_privileged ? null : "g." + l.regions).attr("class", l.zoomRect).attr("width", e.width).attr("height", e.height).style("opacity", 0).on("dblclick.zoom", null), h.axis_x_extent && e.brush.extent(e.getDefaultExtent()), e.axis.init(), e.updateTargets(e.data.targets), i && (e.updateDimension(), e.config.oninit.call(e), e.redraw({ withTransition: !1, withTransform: !0, withUpdateXDomain: !0, withUpdateOrgXDomain: !0, withTransitionForAxis: !1 })), null == a.onresize && (a.onresize = e.generateResize()), a.onresize.add && (a.onresize.add(function () { h.onresize.call(e) }), a.onresize.add(function () { e.api.flush() }), a.onresize.add(function () { h.onresized.call(e) })), e.api.element = e.selectChart.node() }, i.smoothLines = function (a, b) { var c = this; "grid" === b && a.each(function () { var a = c.d3.select(this), b = a.attr("x1"), d = a.attr("x2"), e = a.attr("y1"), f = a.attr("y2"); a.attr({ x1: Math.ceil(b), x2: Math.ceil(d), y1: Math.ceil(e), y2: Math.ceil(f) }) }) }, i.updateSizes = function () { var a = this, b = a.config, c = a.legend ? a.getLegendHeight() : 0, d = a.legend ? a.getLegendWidth() : 0, e = a.isLegendRight || a.isLegendInset ? 0 : c, f = a.hasArcType(), g = b.axis_rotated || f ? 0 : a.getHorizontalAxisHeight("x"), h = b.subchart_show && !f ? b.subchart_size_height + g : 0; a.currentWidth = a.getCurrentWidth(), a.currentHeight = a.getCurrentHeight(), a.margin = b.axis_rotated ? { top: a.getHorizontalAxisHeight("y2") + a.getCurrentPaddingTop(), right: f ? 0 : a.getCurrentPaddingRight(), bottom: a.getHorizontalAxisHeight("y") + e + a.getCurrentPaddingBottom(), left: h + (f ? 0 : a.getCurrentPaddingLeft()) } : { top: 4 + a.getCurrentPaddingTop(), right: f ? 0 : a.getCurrentPaddingRight(), bottom: g + h + e + a.getCurrentPaddingBottom(), left: f ? 0 : a.getCurrentPaddingLeft() }, a.margin2 = b.axis_rotated ? { top: a.margin.top, right: 0 / 0, bottom: 20 + e, left: a.rotated_padding_left } : { top: a.currentHeight - h - e, right: 0 / 0, bottom: g + e, left: a.margin.left }, a.margin3 = { top: 0, right: 0 / 0, bottom: 0, left: 0 }, a.updateSizeForLegend && a.updateSizeForLegend(c, d), a.width = a.currentWidth - a.margin.left - a.margin.right, a.height = a.currentHeight - a.margin.top - a.margin.bottom, a.width < 0 && (a.width = 0), a.height < 0 && (a.height = 0), a.width2 = b.axis_rotated ? a.margin.left - a.rotated_padding_left - a.rotated_padding_right : a.width, a.height2 = b.axis_rotated ? a.height : a.currentHeight - a.margin2.top - a.margin2.bottom, a.width2 < 0 && (a.width2 = 0), a.height2 < 0 && (a.height2 = 0), a.arcWidth = a.width - (a.isLegendRight ? d + 10 : 0), a.arcHeight = a.height - (a.isLegendRight ? 0 : 10), a.hasType("gauge") && (a.arcHeight += a.height - a.getGaugeLabelHeight()), a.updateRadius && a.updateRadius(), a.isLegendRight && f && (a.margin3.left = a.arcWidth / 2 + 1.1 * a.radiusExpanded) }, i.updateTargets = function (a) { var b = this; b.updateTargetsForText(a), b.updateTargetsForBar(a), b.updateTargetsForLine(a), b.hasArcType() && b.updateTargetsForArc && b.updateTargetsForArc(a), b.updateTargetsForSubchart && b.updateTargetsForSubchart(a), b.showTargets() }, i.showTargets = function () { var a = this; a.svg.selectAll("." + l.target).filter(function (b) { return a.isTargetToShow(b.id) }).transition().duration(a.config.transition_duration).style("opacity", 1) }, i.redraw = function (a, b) { var c, d, e, f, g, h, i, j, k, m, n, o, p, q, r, s, t, u, v, x, y, z, A, B, C, D, E, F, G, H = this, I = H.main, J = H.d3, K = H.config, L = H.getShapeIndices(H.isAreaType), M = H.getShapeIndices(H.isBarType), N = H.getShapeIndices(H.isLineType), O = H.hasArcType(), P = H.filterTargetsToShow(H.data.targets), Q = H.xv.bind(H); if (a = a || {}, c = w(a, "withY", !0), d = w(a, "withSubchart", !0), e = w(a, "withTransition", !0), h = w(a, "withTransform", !1), i = w(a, "withUpdateXDomain", !1), j = w(a, "withUpdateOrgXDomain", !1), k = w(a, "withTrimXDomain", !0), p = w(a, "withUpdateXAxis", i), m = w(a, "withLegend", !1), n = w(a, "withEventRect", !0), o = w(a, "withDimension", !0), f = w(a, "withTransitionForExit", e), g = w(a, "withTransitionForAxis", e), v = e ? K.transition_duration : 0, x = f ? v : 0, y = g ? v : 0, b = b || H.axis.generateTransitions(y), m && K.legend_show ? H.updateLegend(H.mapToIds(H.data.targets), a, b) : o && H.updateDimension(!0), H.isCategorized() && 0 === P.length && H.x.domain([0, H.axes.x.selectAll(".tick").size()]), P.length ? (H.updateXDomain(P, i, j, k), K.axis_x_tick_values || (B = H.axis.updateXAxisTickValues(P))) : (H.xAxis.tickValues([]), H.subXAxis.tickValues([])), K.zoom_rescale && !a.flow && (E = H.x.orgDomain()), H.y.domain(H.getYDomain(P, "y", E)), H.y2.domain(H.getYDomain(P, "y2", E)), !K.axis_y_tick_values && K.axis_y_tick_count && H.yAxis.tickValues(H.axis.generateTickValues(H.y.domain(), K.axis_y_tick_count)), !K.axis_y2_tick_values && K.axis_y2_tick_count && H.y2Axis.tickValues(H.axis.generateTickValues(H.y2.domain(), K.axis_y2_tick_count)), H.axis.redraw(b, O), H.axis.updateLabels(e), (i || p) && P.length) if (K.axis_x_tick_culling && B) { for (C = 1; C < B.length; C++)if (B.length / C < K.axis_x_tick_culling_max) { D = C; break } H.svg.selectAll("." + l.axisX + " .tick text").each(function (a) { var b = B.indexOf(a); b >= 0 && J.select(this).style("display", b % D ? "none" : "block") }) } else H.svg.selectAll("." + l.axisX + " .tick text").style("display", "block"); q = H.generateDrawArea ? H.generateDrawArea(L, !1) : void 0, r = H.generateDrawBar ? H.generateDrawBar(M) : void 0, s = H.generateDrawLine ? H.generateDrawLine(N, !1) : void 0, t = H.generateXYForText(L, M, N, !0), u = H.generateXYForText(L, M, N, !1), c && (H.subY.domain(H.getYDomain(P, "y")), H.subY2.domain(H.getYDomain(P, "y2"))), H.tooltip.style("display", "none"), H.updateXgridFocus(), I.select("text." + l.text + "." + l.empty).attr("x", H.width / 2).attr("y", H.height / 2).text(K.data_empty_label_text).transition().style("opacity", P.length ? 0 : 1), H.updateGrid(v), H.updateRegion(v), H.updateBar(x), H.updateLine(x), H.updateArea(x), H.updateCircle(), H.hasDataLabel() && H.updateText(x), H.redrawArc && H.redrawArc(v, x, h), H.redrawSubchart && H.redrawSubchart(d, b, v, x, L, M, N), I.selectAll("." + l.selectedCircles).filter(H.isBarType.bind(H)).selectAll("circle").remove(), K.interaction_enabled && !a.flow && n && (H.redrawEventRect(), H.updateZoom && H.updateZoom()), H.updateCircleY(), F = (H.config.axis_rotated ? H.circleY : H.circleX).bind(H), G = (H.config.axis_rotated ? H.circleX : H.circleY).bind(H), a.flow && (A = H.generateFlow({ targets: P, flow: a.flow, duration: a.flow.duration, drawBar: r, drawLine: s, drawArea: q, cx: F, cy: G, xv: Q, xForText: t, yForText: u })), (v || A) && H.isTabVisible() ? J.transition().duration(v).each(function () { var b = [];[H.redrawBar(r, !0), H.redrawLine(s, !0), H.redrawArea(q, !0), H.redrawCircle(F, G, !0), H.redrawText(t, u, a.flow, !0), H.redrawRegion(!0), H.redrawGrid(!0)].forEach(function (a) { a.forEach(function (a) { b.push(a) }) }), z = H.generateWait(), b.forEach(function (a) { z.add(a) }) }).call(z, function () { A && A(), K.onrendered && K.onrendered.call(H) }) : (H.redrawBar(r), H.redrawLine(s), H.redrawArea(q), H.redrawCircle(F, G), H.redrawText(t, u, a.flow), H.redrawRegion(), H.redrawGrid(), K.onrendered && K.onrendered.call(H)), H.mapToIds(H.data.targets).forEach(function (a) { H.withoutFadeIn[a] = !0 }) }, i.updateAndRedraw = function (a) { var b, c = this, d = c.config; a = a || {}, a.withTransition = w(a, "withTransition", !0), a.withTransform = w(a, "withTransform", !1), a.withLegend = w(a, "withLegend", !1), a.withUpdateXDomain = !0, a.withUpdateOrgXDomain = !0, a.withTransitionForExit = !1, a.withTransitionForTransform = w(a, "withTransitionForTransform", a.withTransition), c.updateSizes(), a.withLegend && d.legend_show || (b = c.axis.generateTransitions(a.withTransitionForAxis ? d.transition_duration : 0), c.updateScales(), c.updateSvgSize(), c.transformAll(a.withTransitionForTransform, b)), c.redraw(a, b) }, i.redrawWithoutRescale = function () { this.redraw({ withY: !1, withSubchart: !1, withEventRect: !1, withTransitionForAxis: !1 }) }, i.isTimeSeries = function () { return "timeseries" === this.config.axis_x_type }, i.isCategorized = function () { return this.config.axis_x_type.indexOf("categor") >= 0 }, i.isCustomX = function () { var a = this, b = a.config; return !a.isTimeSeries() && (b.data_x || v(b.data_xs)) }, i.isTimeSeriesY = function () { return "timeseries" === this.config.axis_y_type }, i.getTranslate = function (a) { var b, c, d = this, e = d.config; return "main" === a ? (b = s(d.margin.left), c = s(d.margin.top)) : "context" === a ? (b = s(d.margin2.left), c = s(d.margin2.top)) : "legend" === a ? (b = d.margin3.left, c = d.margin3.top) : "x" === a ? (b = 0, c = e.axis_rotated ? 0 : d.height) : "y" === a ? (b = 0, c = e.axis_rotated ? d.height : 0) : "y2" === a ? (b = e.axis_rotated ? 0 : d.width, c = e.axis_rotated ? 1 : 0) : "subx" === a ? (b = 0, c = e.axis_rotated ? 0 : d.height2) : "arc" === a && (b = d.arcWidth / 2, c = d.arcHeight / 2), "translate(" + b + "," + c + ")" }, i.initialOpacity = function (a) { return null !== a.value && this.withoutFadeIn[a.id] ? 1 : 0 }, i.initialOpacityForCircle = function (a) { return null !== a.value && this.withoutFadeIn[a.id] ? this.opacityForCircle(a) : 0 }, i.opacityForCircle = function (a) { var b = this.config.point_show ? 1 : 0; return m(a.value) ? this.isScatterType(a) ? .5 : b : 0 }, i.opacityForText = function () { return this.hasDataLabel() ? 1 : 0 }, i.xx = function (a) { return a ? this.x(a.x) : null }, i.xv = function (a) { var b = this, c = a.value; return b.isTimeSeries() ? c = b.parseDate(a.value) : b.isCategorized() && "string" == typeof a.value && (c = b.config.axis_x_categories.indexOf(a.value)), Math.ceil(b.x(c)) }, i.yv = function (a) { var b = this, c = a.axis && "y2" === a.axis ? b.y2 : b.y; return Math.ceil(c(a.value)) }, i.subxx = function (a) { return a ? this.subX(a.x) : null }, i.transformMain = function (a, b) { var c, d, e, f = this; b && b.axisX ? c = b.axisX : (c = f.main.select("." + l.axisX), a && (c = c.transition())), b && b.axisY ? d = b.axisY : (d = f.main.select("." + l.axisY), a && (d = d.transition())), b && b.axisY2 ? e = b.axisY2 : (e = f.main.select("." + l.axisY2), a && (e = e.transition())), (a ? f.main.transition() : f.main).attr("transform", f.getTranslate("main")), c.attr("transform", f.getTranslate("x")), d.attr("transform", f.getTranslate("y")), e.attr("transform", f.getTranslate("y2")), f.main.select("." + l.chartArcs).attr("transform", f.getTranslate("arc")) }, i.transformAll = function (a, b) { var c = this; c.transformMain(a, b), c.config.subchart_show && c.transformContext(a, b), c.legend && c.transformLegend(a) }, i.updateSvgSize = function () { var a = this, b = a.svg.select(".c3-brush .background"); a.svg.attr("width", a.currentWidth).attr("height", a.currentHeight), a.svg.selectAll(["#" + a.clipId, "#" + a.clipIdForGrid]).select("rect").attr("width", a.width).attr("height", a.height), a.svg.select("#" + a.clipIdForXAxis).select("rect").attr("x", a.getXAxisClipX.bind(a)).attr("y", a.getXAxisClipY.bind(a)).attr("width", a.getXAxisClipWidth.bind(a)).attr("height", a.getXAxisClipHeight.bind(a)), a.svg.select("#" + a.clipIdForYAxis).select("rect").attr("x", a.getYAxisClipX.bind(a)).attr("y", a.getYAxisClipY.bind(a)).attr("width", a.getYAxisClipWidth.bind(a)).attr("height", a.getYAxisClipHeight.bind(a)), a.svg.select("#" + a.clipIdForSubchart).select("rect").attr("width", a.width).attr("height", b.size() ? b.attr("height") : 0), a.svg.select("." + l.zoomRect).attr("width", a.width).attr("height", a.height), a.selectChart.style("max-height", a.currentHeight + "px") }, i.updateDimension = function (a) { var b = this; a || (b.config.axis_rotated ? (b.axes.x.call(b.xAxis), b.axes.subx.call(b.subXAxis)) : (b.axes.y.call(b.yAxis), b.axes.y2.call(b.y2Axis))), b.updateSizes(), b.updateScales(), b.updateSvgSize(), b.transformAll(!1) }, i.observeInserted = function (b) { var c, d = this; return "undefined" == typeof MutationObserver ? void a.console.error("MutationObserver not defined.") : (c = new MutationObserver(function (e) { e.forEach(function (e) { "childList" === e.type && e.previousSibling && (c.disconnect(), d.intervalForObserveInserted = a.setInterval(function () { b.node().parentNode && (a.clearInterval(d.intervalForObserveInserted), d.updateDimension(), d.config.oninit.call(d), d.redraw({ withTransform: !0, withUpdateXDomain: !0, withUpdateOrgXDomain: !0, withTransition: !1, withTransitionForTransform: !1, withLegend: !0 }), b.transition().style("opacity", 1)) }, 10)) }) }), void c.observe(b.node(), { attributes: !0, childList: !0, characterData: !0 })) }, i.generateResize = function () { function a() { b.forEach(function (a) { a() }) } var b = []; return a.add = function (a) { b.push(a) }, a }, i.endall = function (a, b) { var c = 0; a.each(function () { ++c }).each("end", function () { --c || b.apply(this, arguments) }) }, i.generateWait = function () { var a = [], b = function (b, c) { var d = setInterval(function () { var b = 0; a.forEach(function (a) { if (a.empty()) return void (b += 1); try { a.transition() } catch (c) { b += 1 } }), b === a.length && (clearInterval(d), c && c()) }, 10) }; return b.add = function (b) { a.push(b) }, b }, i.parseDate = function (b) { var c, d = this; return b instanceof Date ? c = b : "string" == typeof b ? c = d.dataTimeFormat(d.config.data_xFormat).parse(b) : "number" != typeof b && isNaN(b) || (c = new Date(+b)), (!c || isNaN(+c)) && a.console.error("Failed to parse x '" + b + "' to Date object"), c }, i.isTabVisible = function () { var a; return "undefined" != typeof document.hidden ? a = "hidden" : "undefined" != typeof document.mozHidden ? a = "mozHidden" : "undefined" != typeof document.msHidden ? a = "msHidden" : "undefined" != typeof document.webkitHidden && (a = "webkitHidden"), document[a] ? !1 : !0 }, i.getDefaultConfig = function () { var a = { bindto: "#chart", size_width: void 0, size_height: void 0, padding_left: void 0, padding_right: void 0, padding_top: void 0, padding_bottom: void 0, zoom_enabled: !1, zoom_extent: void 0, zoom_privileged: !1, zoom_rescale: !1, zoom_onzoom: function () { }, zoom_onzoomstart: function () { }, zoom_onzoomend: function () { }, interaction_enabled: !0, onmouseover: function () { }, onmouseout: function () { }, onresize: function () { }, onresized: function () { }, oninit: function () { }, onrendered: function () { }, transition_duration: 350, data_x: void 0, data_xs: {}, data_xFormat: "%Y-%m-%d", data_xLocaltime: !0, data_xSort: !0, data_idConverter: function (a) { return a }, data_names: {}, data_classes: {}, data_groups: [], data_axes: {}, data_type: void 0, data_types: {}, data_labels: {}, data_order: "desc", data_regions: {}, data_color: void 0, data_colors: {}, data_hide: !1, data_filter: void 0, data_selection_enabled: !1, data_selection_grouped: !1, data_selection_isselectable: function () { return !0 }, data_selection_multiple: !0, data_selection_draggable: !1, data_onclick: function () { }, data_onmouseover: function () { }, data_onmouseout: function () { }, data_onselected: function () { }, data_onunselected: function () { }, data_url: void 0, data_json: void 0, data_rows: void 0, data_columns: void 0, data_mimeType: void 0, data_keys: void 0, data_empty_label_text: "", subchart_show: !1, subchart_size_height: 60, subchart_onbrush: function () { }, color_pattern: [], color_threshold: {}, legend_show: !0, legend_hide: !1, legend_position: "bottom", legend_inset_anchor: "top-left", legend_inset_x: 10, legend_inset_y: 0, legend_inset_step: void 0, legend_item_onclick: void 0, legend_item_onmouseover: void 0, legend_item_onmouseout: void 0, legend_equally: !1, axis_rotated: !1, axis_x_show: !0, axis_x_type: "indexed", axis_x_localtime: !0, axis_x_categories: [], axis_x_tick_centered: !1, axis_x_tick_format: void 0, axis_x_tick_culling: {}, axis_x_tick_culling_max: 10, axis_x_tick_count: void 0, axis_x_tick_fit: !0, axis_x_tick_values: null, axis_x_tick_rotate: 0, axis_x_tick_outer: !0, axis_x_tick_multiline: !0, axis_x_tick_width: null, axis_x_max: void 0, axis_x_min: void 0, axis_x_padding: {}, axis_x_height: void 0, axis_x_extent: void 0, axis_x_label: {}, axis_y_show: !0, axis_y_type: void 0, axis_y_max: void 0, axis_y_min: void 0, axis_y_inverted: !1, axis_y_center: void 0, axis_y_inner: void 0, axis_y_label: {}, axis_y_tick_format: void 0, axis_y_tick_outer: !0, axis_y_tick_values: null, axis_y_tick_count: void 0, axis_y_tick_time_value: void 0, axis_y_tick_time_interval: void 0, axis_y_padding: {}, axis_y_default: void 0, axis_y2_show: !1, axis_y2_max: void 0, axis_y2_min: void 0, axis_y2_inverted: !1, axis_y2_center: void 0, axis_y2_inner: void 0, axis_y2_label: {}, axis_y2_tick_format: void 0, axis_y2_tick_outer: !0, axis_y2_tick_values: null, axis_y2_tick_count: void 0, axis_y2_padding: {}, axis_y2_default: void 0, grid_x_show: !1, grid_x_type: "tick", grid_x_lines: [], grid_y_show: !1, grid_y_lines: [], grid_y_ticks: 10, grid_focus_show: !0, grid_lines_front: !0, point_show: !0, point_r: 2.5, point_focus_expand_enabled: !0, point_focus_expand_r: void 0, point_select_r: void 0, line_connectNull: !1, line_step_type: "step", bar_width: void 0, bar_width_ratio: .6, bar_width_max: void 0, bar_zerobased: !0, area_zerobased: !0, pie_label_show: !0, pie_label_format: void 0, pie_label_threshold: .05, pie_expand: !0, gauge_label_show: !0, gauge_label_format: void 0, gauge_expand: !0, gauge_min: 0, gauge_max: 100, gauge_units: void 0, gauge_width: void 0, donut_label_show: !0, donut_label_format: void 0, donut_label_threshold: .05, donut_width: void 0, donut_expand: !0, donut_title: "", regions: [], tooltip_show: !0, tooltip_grouped: !0, tooltip_format_title: void 0, tooltip_format_name: void 0, tooltip_format_value: void 0, tooltip_position: void 0, tooltip_contents: function (a, b, c, d) { return this.getTooltipContent ? this.getTooltipContent(a, b, c, d) : "" }, tooltip_init_show: !1, tooltip_init_x: 0, tooltip_init_position: { top: "0px", left: "50px" } }; return Object.keys(this.additionalConfig).forEach(function (b) { a[b] = this.additionalConfig[b] }, this), a }, i.additionalConfig = {}, i.loadConfig = function (a) { function b() { var a = d.shift(); return a && c && "object" == typeof c && a in c ? (c = c[a], b()) : a ? void 0 : c } var c, d, e, f = this.config; Object.keys(f).forEach(function (g) { c = a, d = g.split("_"), e = b(), q(e) && (f[g] = e) }) }, i.getScale = function (a, b, c) { return (c ? this.d3.time.scale() : this.d3.scale.linear()).range([a, b]) }, i.getX = function (a, b, c, d) { var e, f = this, g = f.getScale(a, b, f.isTimeSeries()), h = c ? g.domain(c) : g; f.isCategorized() ? (d = d || function () { return 0 }, g = function (a, b) { var c = h(a) + d(a); return b ? c : Math.ceil(c) }) : g = function (a, b) { var c = h(a); return b ? c : Math.ceil(c) }; for (e in h) g[e] = h[e]; return g.orgDomain = function () { return h.domain() }, f.isCategorized() && (g.domain = function (a) { return arguments.length ? (h.domain(a), g) : (a = this.orgDomain(), [a[0], a[1] + 1]) }), g }, i.getY = function (a, b, c) { var d = this.getScale(a, b, this.isTimeSeriesY()); return c && d.domain(c), d }, i.getYScale = function (a) { return "y2" === this.axis.getId(a) ? this.y2 : this.y }, i.getSubYScale = function (a) { return "y2" === this.axis.getId(a) ? this.subY2 : this.subY }, i.updateScales = function () { var a = this, b = a.config, c = !a.x; a.xMin = b.axis_rotated ? 1 : 0, a.xMax = b.axis_rotated ? a.height : a.width, a.yMin = b.axis_rotated ? 0 : a.height, a.yMax = b.axis_rotated ? a.width : 1, a.subXMin = a.xMin, a.subXMax = a.xMax, a.subYMin = b.axis_rotated ? 0 : a.height2, a.subYMax = b.axis_rotated ? a.width2 : 1, a.x = a.getX(a.xMin, a.xMax, c ? void 0 : a.x.orgDomain(), function () { return a.xAxis.tickOffset() }), a.y = a.getY(a.yMin, a.yMax, c ? b.axis_y_default : a.y.domain()), a.y2 = a.getY(a.yMin, a.yMax, c ? b.axis_y2_default : a.y2.domain()), a.subX = a.getX(a.xMin, a.xMax, a.orgXDomain, function (b) { return b % 1 ? 0 : a.subXAxis.tickOffset() }), a.subY = a.getY(a.subYMin, a.subYMax, c ? b.axis_y_default : a.subY.domain()), a.subY2 = a.getY(a.subYMin, a.subYMax, c ? b.axis_y2_default : a.subY2.domain()), a.xAxisTickFormat = a.axis.getXAxisTickFormat(), a.xAxisTickValues = a.axis.getXAxisTickValues(), a.yAxisTickValues = a.axis.getYAxisTickValues(), a.y2AxisTickValues = a.axis.getY2AxisTickValues(), a.xAxis = a.axis.getXAxis(a.x, a.xOrient, a.xAxisTickFormat, a.xAxisTickValues, b.axis_x_tick_outer), a.subXAxis = a.axis.getXAxis(a.subX, a.subXOrient, a.xAxisTickFormat, a.xAxisTickValues, b.axis_x_tick_outer), a.yAxis = a.axis.getYAxis(a.y, a.yOrient, b.axis_y_tick_format, a.yAxisTickValues, b.axis_y_tick_outer), a.y2Axis = a.axis.getYAxis(a.y2, a.y2Orient, b.axis_y2_tick_format, a.y2AxisTickValues, b.axis_y2_tick_outer), c || (a.brush && a.brush.scale(a.subX), b.zoom_enabled && a.zoom.scale(a.x)), a.updateArc && a.updateArc() }, i.getYDomainMin = function (a) { var b, c, d, e, f, g, h = this, i = h.config, j = h.mapToIds(a), k = h.getValuesAsIdKeyed(a); if (i.data_groups.length > 0) for (g = h.hasNegativeValueInTargets(a), b = 0; b < i.data_groups.length; b++)if (e = i.data_groups[b].filter(function (a) { return j.indexOf(a) >= 0 }), 0 !== e.length) for (d = e[0], g && k[d] && k[d].forEach(function (a, b) { k[d][b] = 0 > a ? a : 0 }), c = 1; c < e.length; c++)f = e[c], k[f] && k[f].forEach(function (a, b) { h.axis.getId(f) !== h.axis.getId(d) || !k[d] || g && +a > 0 || (k[d][b] += +a) }); return h.d3.min(Object.keys(k).map(function (a) { return h.d3.min(k[a]) })) }, i.getYDomainMax = function (a) { var b, c, d, e, f, g, h = this, i = h.config, j = h.mapToIds(a), k = h.getValuesAsIdKeyed(a); if (i.data_groups.length > 0) for (g = h.hasPositiveValueInTargets(a), b = 0; b < i.data_groups.length; b++)if (e = i.data_groups[b].filter(function (a) { return j.indexOf(a) >= 0 }), 0 !== e.length) for (d = e[0], g && k[d] && k[d].forEach(function (a, b) { k[d][b] = a > 0 ? a : 0 }), c = 1; c < e.length; c++)f = e[c], k[f] && k[f].forEach(function (a, b) { h.axis.getId(f) !== h.axis.getId(d) || !k[d] || g && 0 > +a || (k[d][b] += +a) }); return h.d3.max(Object.keys(k).map(function (a) { return h.d3.max(k[a]) })) }, i.getYDomain = function (a, b, c) { var d, e, f, g, h, i, j, k, l, n, o, p = this, q = p.config, r = a.filter(function (a) { return p.axis.getId(a.id) === b }), s = c ? p.filterByXDomain(r, c) : r, u = "y2" === b ? q.axis_y2_min : q.axis_y_min, w = "y2" === b ? q.axis_y2_max : q.axis_y_max, x = p.getYDomainMin(s), y = p.getYDomainMax(s), z = "y2" === b ? q.axis_y2_center : q.axis_y_center, A = p.hasType("bar", s) && q.bar_zerobased || p.hasType("area", s) && q.area_zerobased, B = "y2" === b ? q.axis_y2_inverted : q.axis_y_inverted, C = p.hasDataLabel() && q.axis_rotated, D = p.hasDataLabel() && !q.axis_rotated; return x = m(u) ? u : m(w) ? w > x ? x : w - 10 : x, y = m(w) ? w : m(u) ? y > u ? y : u + 10 : y, 0 === s.length ? "y2" === b ? p.y2.domain() : p.y.domain() : (isNaN(x) && (x = 0), isNaN(y) && (y = x), x === y && (0 > x ? y = 0 : x = 0), n = x >= 0 && y >= 0, o = 0 >= x && 0 >= y, (m(u) && n || m(w) && o) && (A = !1), A && (n && (x = 0), o && (y = 0)), e = Math.abs(y - x), f = g = h = .1 * e, "undefined" != typeof z && (i = Math.max(Math.abs(x), Math.abs(y)), y = z + i, x = z - i), C ? (j = p.getDataLabelLength(x, y, "width"), k = t(p.y.range()), l = [j[0] / k, j[1] / k], g += e * (l[1] / (1 - l[0] - l[1])), h += e * (l[0] / (1 - l[0] - l[1]))) : D && (j = p.getDataLabelLength(x, y, "height"), g += p.axis.convertPixelsToAxisPadding(j[1], e), h += p.axis.convertPixelsToAxisPadding(j[0], e)), "y" === b && v(q.axis_y_padding) && (g = p.axis.getPadding(q.axis_y_padding, "top", g, e), h = p.axis.getPadding(q.axis_y_padding, "bottom", h, e)), "y2" === b && v(q.axis_y2_padding) && (g = p.axis.getPadding(q.axis_y2_padding, "top", g, e), h = p.axis.getPadding(q.axis_y2_padding, "bottom", h, e)), A && (n && (h = x), o && (g = -y)), d = [x - h, y + g], B ? d.reverse() : d) }, i.getXDomainMin = function (a) { var b = this, c = b.config; return q(c.axis_x_min) ? b.isTimeSeries() ? this.parseDate(c.axis_x_min) : c.axis_x_min : b.d3.min(a, function (a) { return b.d3.min(a.values, function (a) { return a.x }) }) }, i.getXDomainMax = function (a) { var b = this, c = b.config; return q(c.axis_x_max) ? b.isTimeSeries() ? this.parseDate(c.axis_x_max) : c.axis_x_max : b.d3.max(a, function (a) { return b.d3.max(a.values, function (a) { return a.x }) }) }, i.getXDomainPadding = function (a) { var b, c, d, e, f = this, g = f.config, h = a[1] - a[0]; return f.isCategorized() ? c = 0 : f.hasType("bar") ? (b = f.getMaxDataCount(), c = b > 1 ? h / (b - 1) / 2 : .5) : c = .01 * h, "object" == typeof g.axis_x_padding && v(g.axis_x_padding) ? (d = m(g.axis_x_padding.left) ? g.axis_x_padding.left : c, e = m(g.axis_x_padding.right) ? g.axis_x_padding.right : c) : d = e = "number" == typeof g.axis_x_padding ? g.axis_x_padding : c, { left: d, right: e } }, i.getXDomain = function (a) {
		var b = this, c = [b.getXDomainMin(a), b.getXDomainMax(a)], d = c[0], e = c[1], f = b.getXDomainPadding(c), g = 0, h = 0;
		return d - e !== 0 || b.isCategorized() || (b.isTimeSeries() ? (d = new Date(.5 * d.getTime()), e = new Date(1.5 * e.getTime())) : (d = 0 === d ? 1 : .5 * d, e = 0 === e ? -1 : 1.5 * e)), (d || 0 === d) && (g = b.isTimeSeries() ? new Date(d.getTime() - f.left) : d - f.left), (e || 0 === e) && (h = b.isTimeSeries() ? new Date(e.getTime() + f.right) : e + f.right), [g, h]
	}, i.updateXDomain = function (a, b, c, d, e) { var f = this, g = f.config; return c && (f.x.domain(e ? e : f.d3.extent(f.getXDomain(a))), f.orgXDomain = f.x.domain(), g.zoom_enabled && f.zoom.scale(f.x).updateScaleExtent(), f.subX.domain(f.x.domain()), f.brush && f.brush.scale(f.subX)), b && (f.x.domain(e ? e : !f.brush || f.brush.empty() ? f.orgXDomain : f.brush.extent()), g.zoom_enabled && f.zoom.scale(f.x).updateScaleExtent()), d && f.x.domain(f.trimXDomain(f.x.orgDomain())), f.x.domain() }, i.trimXDomain = function (a) { var b = this; return a[0] <= b.orgXDomain[0] && (a[1] = +a[1] + (b.orgXDomain[0] - a[0]), a[0] = b.orgXDomain[0]), b.orgXDomain[1] <= a[1] && (a[0] = +a[0] - (a[1] - b.orgXDomain[1]), a[1] = b.orgXDomain[1]), a }, i.isX = function (a) { var b = this, c = b.config; return c.data_x && a === c.data_x || v(c.data_xs) && x(c.data_xs, a) }, i.isNotX = function (a) { return !this.isX(a) }, i.getXKey = function (a) { var b = this, c = b.config; return c.data_x ? c.data_x : v(c.data_xs) ? c.data_xs[a] : null }, i.getXValuesOfXKey = function (a, b) { var c, d = this, e = b && v(b) ? d.mapToIds(b) : []; return e.forEach(function (b) { d.getXKey(b) === a && (c = d.data.xs[b]) }), c }, i.getIndexByX = function (a) { var b = this, c = b.filterByX(b.data.targets, a); return c.length ? c[0].index : null }, i.getXValue = function (a, b) { var c = this; return a in c.data.xs && c.data.xs[a] && m(c.data.xs[a][b]) ? c.data.xs[a][b] : b }, i.getOtherTargetXs = function () { var a = this, b = Object.keys(a.data.xs); return b.length ? a.data.xs[b[0]] : null }, i.getOtherTargetX = function (a) { var b = this.getOtherTargetXs(); return b && a < b.length ? b[a] : null }, i.addXs = function (a) { var b = this; Object.keys(a).forEach(function (c) { b.config.data_xs[c] = a[c] }) }, i.hasMultipleX = function (a) { return this.d3.set(Object.keys(a).map(function (b) { return a[b] })).size() > 1 }, i.isMultipleX = function () { return v(this.config.data_xs) || !this.config.data_xSort || this.hasType("scatter") }, i.addName = function (a) { var b, c = this; return a && (b = c.config.data_names[a.id], a.name = b ? b : a.id), a }, i.getValueOnIndex = function (a, b) { var c = a.filter(function (a) { return a.index === b }); return c.length ? c[0] : null }, i.updateTargetX = function (a, b) { var c = this; a.forEach(function (a) { a.values.forEach(function (d, e) { d.x = c.generateTargetX(b[e], a.id, e) }), c.data.xs[a.id] = b }) }, i.updateTargetXs = function (a, b) { var c = this; a.forEach(function (a) { b[a.id] && c.updateTargetX([a], b[a.id]) }) }, i.generateTargetX = function (a, b, c) { var d, e = this; return d = e.isTimeSeries() ? e.parseDate(a ? a : e.getXValue(b, c)) : e.isCustomX() && !e.isCategorized() ? m(a) ? +a : e.getXValue(b, c) : c }, i.cloneTarget = function (a) { return { id: a.id, id_org: a.id_org, values: a.values.map(function (a) { return { x: a.x, value: a.value, id: a.id } }) } }, i.updateXs = function () { var a = this; a.data.targets.length && (a.xs = [], a.data.targets[0].values.forEach(function (b) { a.xs[b.index] = b.x })) }, i.getPrevX = function (a) { var b = this.xs[a - 1]; return "undefined" != typeof b ? b : null }, i.getNextX = function (a) { var b = this.xs[a + 1]; return "undefined" != typeof b ? b : null }, i.getMaxDataCount = function () { var a = this; return a.d3.max(a.data.targets, function (a) { return a.values.length }) }, i.getMaxDataCountTarget = function (a) { var b, c = a.length, d = 0; return c > 1 ? a.forEach(function (a) { a.values.length > d && (b = a, d = a.values.length) }) : b = c ? a[0] : null, b }, i.getEdgeX = function (a) { var b = this; return a.length ? [b.d3.min(a, function (a) { return a.values[0].x }), b.d3.max(a, function (a) { return a.values[a.values.length - 1].x })] : [0, 0] }, i.mapToIds = function (a) { return a.map(function (a) { return a.id }) }, i.mapToTargetIds = function (a) { var b = this; return a ? o(a) ? [a] : a : b.mapToIds(b.data.targets) }, i.hasTarget = function (a, b) { var c, d = this.mapToIds(a); for (c = 0; c < d.length; c++)if (d[c] === b) return !0; return !1 }, i.isTargetToShow = function (a) { return this.hiddenTargetIds.indexOf(a) < 0 }, i.isLegendToShow = function (a) { return this.hiddenLegendIds.indexOf(a) < 0 }, i.filterTargetsToShow = function (a) { var b = this; return a.filter(function (a) { return b.isTargetToShow(a.id) }) }, i.mapTargetsToUniqueXs = function (a) { var b = this, c = b.d3.set(b.d3.merge(a.map(function (a) { return a.values.map(function (a) { return +a.x }) }))).values(); return c.map(b.isTimeSeries() ? function (a) { return new Date(+a) } : function (a) { return +a }) }, i.addHiddenTargetIds = function (a) { this.hiddenTargetIds = this.hiddenTargetIds.concat(a) }, i.removeHiddenTargetIds = function (a) { this.hiddenTargetIds = this.hiddenTargetIds.filter(function (b) { return a.indexOf(b) < 0 }) }, i.addHiddenLegendIds = function (a) { this.hiddenLegendIds = this.hiddenLegendIds.concat(a) }, i.removeHiddenLegendIds = function (a) { this.hiddenLegendIds = this.hiddenLegendIds.filter(function (b) { return a.indexOf(b) < 0 }) }, i.getValuesAsIdKeyed = function (a) { var b = {}; return a.forEach(function (a) { b[a.id] = [], a.values.forEach(function (c) { b[a.id].push(c.value) }) }), b }, i.checkValueInTargets = function (a, b) { var c, d, e, f = Object.keys(a); for (c = 0; c < f.length; c++)for (e = a[f[c]].values, d = 0; d < e.length; d++)if (b(e[d].value)) return !0; return !1 }, i.hasNegativeValueInTargets = function (a) { return this.checkValueInTargets(a, function (a) { return 0 > a }) }, i.hasPositiveValueInTargets = function (a) { return this.checkValueInTargets(a, function (a) { return a > 0 }) }, i.isOrderDesc = function () { var a = this.config; return "string" == typeof a.data_order && "desc" === a.data_order.toLowerCase() }, i.isOrderAsc = function () { var a = this.config; return "string" == typeof a.data_order && "asc" === a.data_order.toLowerCase() }, i.orderTargets = function (a) { var b = this, c = b.config, d = b.isOrderAsc(), e = b.isOrderDesc(); return d || e ? a.sort(function (a, b) { var c = function (a, b) { return a + Math.abs(b.value) }, e = a.values.reduce(c, 0), f = b.values.reduce(c, 0); return d ? f - e : e - f }) : n(c.data_order) && a.sort(c.data_order), a }, i.filterByX = function (a, b) { return this.d3.merge(a.map(function (a) { return a.values })).filter(function (a) { return a.x - b === 0 }) }, i.filterRemoveNull = function (a) { return a.filter(function (a) { return m(a.value) }) }, i.filterByXDomain = function (a, b) { return a.map(function (a) { return { id: a.id, id_org: a.id_org, values: a.values.filter(function (a) { return b[0] <= a.x && a.x <= b[1] }) } }) }, i.hasDataLabel = function () { var a = this.config; return "boolean" == typeof a.data_labels && a.data_labels ? !0 : "object" == typeof a.data_labels && v(a.data_labels) ? !0 : !1 }, i.getDataLabelLength = function (a, b, c) { var d = this, e = [0, 0], f = 1.3; return d.selectChart.select("svg").selectAll(".dummy").data([a, b]).enter().append("text").text(function (a) { return d.dataLabelFormat(a.id)(a) }).each(function (a, b) { e[b] = this.getBoundingClientRect()[c] * f }).remove(), e }, i.isNoneArc = function (a) { return this.hasTarget(this.data.targets, a.id) }, i.isArc = function (a) { return "data" in a && this.hasTarget(this.data.targets, a.data.id) }, i.findSameXOfValues = function (a, b) { var c, d = a[b].x, e = []; for (c = b - 1; c >= 0 && d === a[c].x; c--)e.push(a[c]); for (c = b; c < a.length && d === a[c].x; c++)e.push(a[c]); return e }, i.findClosestFromTargets = function (a, b) { var c, d = this; return c = a.map(function (a) { return d.findClosest(a.values, b) }), d.findClosest(c, b) }, i.findClosest = function (a, b) { var c, d = this, e = 100; return a.filter(function (a) { return a && d.isBarType(a.id) }).forEach(function (a) { var b = d.main.select("." + l.bars + d.getTargetSelectorSuffix(a.id) + " ." + l.bar + "-" + a.index).node(); !c && d.isWithinBar(b) && (c = a) }), a.filter(function (a) { return a && !d.isBarType(a.id) }).forEach(function (a) { var f = d.dist(a, b); e > f && (e = f, c = a) }), c }, i.dist = function (a, b) { var c = this, d = c.config, e = d.axis_rotated ? 1 : 0, f = d.axis_rotated ? 0 : 1, g = c.circleY(a, a.index), h = c.x(a.x); return Math.pow(h - b[e], 2) + Math.pow(g - b[f], 2) }, i.convertValuesToStep = function (a) { var b, c = [].concat(a); if (!this.isCategorized()) return a; for (b = a.length + 1; b > 0; b--)c[b] = c[b - 1]; return c[0] = { x: c[0].x - 1, value: c[0].value, id: c[0].id }, c[a.length + 1] = { x: c[a.length].x + 1, value: c[a.length].value, id: c[a.length].id }, c }, i.updateDataAttributes = function (a, b) { var c = this, d = c.config, e = d["data_" + a]; return "undefined" == typeof b ? e : (Object.keys(b).forEach(function (a) { e[a] = b[a] }), c.redraw({ withLegend: !0 }), e) }, i.convertUrlToData = function (a, b, c, d) { var e = this, f = b ? b : "csv"; e.d3.xhr(a, function (a, b) { var g; if (!b) throw new Error(a.responseURL + " " + a.status + " (" + a.statusText + ")"); g = "json" === f ? e.convertJsonToData(JSON.parse(b.response), c) : "tsv" === f ? e.convertTsvToData(b.response) : e.convertCsvToData(b.response), d.call(e, g) }) }, i.convertXsvToData = function (a, b) { var c, d = b.parseRows(a); return 1 === d.length ? (c = [{}], d[0].forEach(function (a) { c[0][a] = null })) : c = b.parse(a), c }, i.convertCsvToData = function (a) { return this.convertXsvToData(a, this.d3.csv) }, i.convertTsvToData = function (a) { return this.convertXsvToData(a, this.d3.tsv) }, i.convertJsonToData = function (a, b) { var c, d, e = this, f = []; return b ? (b.x ? (c = b.value.concat(b.x), e.config.data_x = b.x) : c = b.value, f.push(c), a.forEach(function (a) { var b = []; c.forEach(function (c) { var d = p(a[c]) ? null : a[c]; b.push(d) }), f.push(b) }), d = e.convertRowsToData(f)) : (Object.keys(a).forEach(function (b) { f.push([b].concat(a[b])) }), d = e.convertColumnsToData(f)), d }, i.convertRowsToData = function (a) { var b, c, d = a[0], e = {}, f = []; for (b = 1; b < a.length; b++) { for (e = {}, c = 0; c < a[b].length; c++) { if (p(a[b][c])) throw new Error("Source data is missing a component at (" + b + "," + c + ")!"); e[d[c]] = a[b][c] } f.push(e) } return f }, i.convertColumnsToData = function (a) { var b, c, d, e = []; for (b = 0; b < a.length; b++)for (d = a[b][0], c = 1; c < a[b].length; c++) { if (p(e[c - 1]) && (e[c - 1] = {}), p(a[b][c])) throw new Error("Source data is missing a component at (" + b + "," + c + ")!"); e[c - 1][d] = a[b][c] } return e }, i.convertDataToTargets = function (a, b) { var c, d = this, e = d.config, f = d.d3.keys(a[0]).filter(d.isNotX, d), g = d.d3.keys(a[0]).filter(d.isX, d); return f.forEach(function (c) { var f = d.getXKey(c); d.isCustomX() || d.isTimeSeries() ? g.indexOf(f) >= 0 ? d.data.xs[c] = (b && d.data.xs[c] ? d.data.xs[c] : []).concat(a.map(function (a) { return a[f] }).filter(m).map(function (a, b) { return d.generateTargetX(a, c, b) })) : e.data_x ? d.data.xs[c] = d.getOtherTargetXs() : v(e.data_xs) && (d.data.xs[c] = d.getXValuesOfXKey(f, d.data.targets)) : d.data.xs[c] = a.map(function (a, b) { return b }) }), f.forEach(function (a) { if (!d.data.xs[a]) throw new Error('x is not defined for id = "' + a + '".') }), c = f.map(function (b, c) { var f = e.data_idConverter(b); return { id: f, id_org: b, values: a.map(function (a, g) { var h = d.getXKey(b), i = a[h], j = d.generateTargetX(i, b, g); return d.isCustomX() && d.isCategorized() && 0 === c && i && (0 === g && (e.axis_x_categories = []), e.axis_x_categories.push(i)), (p(a[b]) || d.data.xs[b].length <= g) && (j = void 0), { x: j, value: null === a[b] || isNaN(a[b]) ? null : +a[b], id: f } }).filter(function (a) { return q(a.x) }) } }), c.forEach(function (a) { var b; e.data_xSort && (a.values = a.values.sort(function (a, b) { var c = a.x || 0 === a.x ? a.x : 1 / 0, d = b.x || 0 === b.x ? b.x : 1 / 0; return c - d })), b = 0, a.values.forEach(function (a) { a.index = b++ }), d.data.xs[a.id].sort(function (a, b) { return a - b }) }), e.data_type && d.setTargetType(d.mapToIds(c).filter(function (a) { return !(a in e.data_types) }), e.data_type), c.forEach(function (a) { d.addCache(a.id_org, a) }), c }, i.load = function (a, b) { var c = this; a && (b.filter && (a = a.filter(b.filter)), (b.type || b.types) && a.forEach(function (a) { var d = b.types && b.types[a.id] ? b.types[a.id] : b.type; c.setTargetType(a.id, d) }), c.data.targets.forEach(function (b) { for (var c = 0; c < a.length; c++)if (b.id === a[c].id) { b.values = a[c].values, a.splice(c, 1); break } }), c.data.targets = c.data.targets.concat(a)), c.updateTargets(c.data.targets), c.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0, withLegend: !0 }), b.done && b.done() }, i.loadFromArgs = function (a) { var b = this; a.data ? b.load(b.convertDataToTargets(a.data), a) : a.url ? b.convertUrlToData(a.url, a.mimeType, a.keys, function (c) { b.load(b.convertDataToTargets(c), a) }) : a.json ? b.load(b.convertDataToTargets(b.convertJsonToData(a.json, a.keys)), a) : a.rows ? b.load(b.convertDataToTargets(b.convertRowsToData(a.rows)), a) : a.columns ? b.load(b.convertDataToTargets(b.convertColumnsToData(a.columns)), a) : b.load(null, a) }, i.unload = function (a, b) { var c = this; return b || (b = function () { }), a = a.filter(function (a) { return c.hasTarget(c.data.targets, a) }), a && 0 !== a.length ? (c.svg.selectAll(a.map(function (a) { return c.selectorTarget(a) })).transition().style("opacity", 0).remove().call(c.endall, b), void a.forEach(function (a) { c.withoutFadeIn[a] = !1, c.legend && c.legend.selectAll("." + l.legendItem + c.getTargetSelectorSuffix(a)).remove(), c.data.targets = c.data.targets.filter(function (b) { return b.id !== a }) })) : void b() }, i.categoryName = function (a) { var b = this.config; return a < b.axis_x_categories.length ? b.axis_x_categories[a] : a }, i.initEventRect = function () { var a = this; a.main.select("." + l.chart).append("g").attr("class", l.eventRects).style("fill-opacity", 0) }, i.redrawEventRect = function () { var a, b, c = this, d = c.config, e = c.isMultipleX(), f = c.main.select("." + l.eventRects).style("cursor", d.zoom_enabled ? d.axis_rotated ? "ns-resize" : "ew-resize" : null).classed(l.eventRectsMultiple, e).classed(l.eventRectsSingle, !e); f.selectAll("." + l.eventRect).remove(), c.eventRect = f.selectAll("." + l.eventRect), e ? (a = c.eventRect.data([0]), c.generateEventRectsForMultipleXs(a.enter()), c.updateEventRect(a)) : (b = c.getMaxDataCountTarget(c.data.targets), f.datum(b ? b.values : []), c.eventRect = f.selectAll("." + l.eventRect), a = c.eventRect.data(function (a) { return a }), c.generateEventRectsForSingleX(a.enter()), c.updateEventRect(a), a.exit().remove()) }, i.updateEventRect = function (a) { var b, c, d, e, f, g, h = this, i = h.config; a = a || h.eventRect.data(function (a) { return a }), h.isMultipleX() ? (b = 0, c = 0, d = h.width, e = h.height) : (!h.isCustomX() && !h.isTimeSeries() || h.isCategorized() ? (f = h.getEventRectWidth(), g = function (a) { return h.x(a.x) - f / 2 }) : (h.updateXs(), f = function (a) { var b = h.getPrevX(a.index), c = h.getNextX(a.index); return null === b && null === c ? i.axis_rotated ? h.height : h.width : (null === b && (b = h.x.domain()[0]), null === c && (c = h.x.domain()[1]), Math.max(0, (h.x(c) - h.x(b)) / 2)) }, g = function (a) { var b = h.getPrevX(a.index), c = h.getNextX(a.index), d = h.data.xs[a.id][a.index]; return null === b && null === c ? 0 : (null === b && (b = h.x.domain()[0]), (h.x(d) + h.x(b)) / 2) }), b = i.axis_rotated ? 0 : g, c = i.axis_rotated ? g : 0, d = i.axis_rotated ? h.width : f, e = i.axis_rotated ? f : h.height), a.attr("class", h.classEvent.bind(h)).attr("x", b).attr("y", c).attr("width", d).attr("height", e) }, i.generateEventRectsForSingleX = function (a) { var b = this, c = b.d3, d = b.config; a.append("rect").attr("class", b.classEvent.bind(b)).style("cursor", d.data_selection_enabled && d.data_selection_grouped ? "pointer" : null).on("mouseover", function (a) { var c = a.index; b.dragging || b.flowing || b.hasArcType() || (d.point_focus_expand_enabled && b.expandCircles(c, null, !0), b.expandBars(c, null, !0), b.main.selectAll("." + l.shape + "-" + c).each(function (a) { d.data_onmouseover.call(b.api, a) })) }).on("mouseout", function (a) { var c = a.index; b.config && (b.hasArcType() || (b.hideXGridFocus(), b.hideTooltip(), b.unexpandCircles(), b.unexpandBars(), b.main.selectAll("." + l.shape + "-" + c).each(function (a) { d.data_onmouseout.call(b.api, a) }))) }).on("mousemove", function (a) { var e, f = a.index, g = b.svg.select("." + l.eventRect + "-" + f); b.dragging || b.flowing || b.hasArcType() || (b.isStepType(a) && "step-after" === b.config.line_step_type && c.mouse(this)[0] < b.x(b.getXValue(a.id, f)) && (f -= 1), e = b.filterTargetsToShow(b.data.targets).map(function (a) { return b.addName(b.getValueOnIndex(a.values, f)) }), d.tooltip_grouped && (b.showTooltip(e, this), b.showXGridFocus(e)), (!d.tooltip_grouped || d.data_selection_enabled && !d.data_selection_grouped) && b.main.selectAll("." + l.shape + "-" + f).each(function () { c.select(this).classed(l.EXPANDED, !0), d.data_selection_enabled && g.style("cursor", d.data_selection_grouped ? "pointer" : null), d.tooltip_grouped || (b.hideXGridFocus(), b.hideTooltip(), d.data_selection_grouped || (b.unexpandCircles(f), b.unexpandBars(f))) }).filter(function (a) { return b.isWithinShape(this, a) }).each(function (a) { d.data_selection_enabled && (d.data_selection_grouped || d.data_selection_isselectable(a)) && g.style("cursor", "pointer"), d.tooltip_grouped || (b.showTooltip([a], this), b.showXGridFocus([a]), d.point_focus_expand_enabled && b.expandCircles(f, a.id, !0), b.expandBars(f, a.id, !0)) })) }).on("click", function (a) { var e = a.index; if (!b.hasArcType() && b.toggleShape) { if (b.cancelClick) return void (b.cancelClick = !1); b.isStepType(a) && "step-after" === d.line_step_type && c.mouse(this)[0] < b.x(b.getXValue(a.id, e)) && (e -= 1), b.main.selectAll("." + l.shape + "-" + e).each(function (a) { (d.data_selection_grouped || b.isWithinShape(this, a)) && (b.toggleShape(this, a, e), b.config.data_onclick.call(b.api, a, this)) }) } }).call(d.data_selection_draggable && b.drag ? c.behavior.drag().origin(Object).on("drag", function () { b.drag(c.mouse(this)) }).on("dragstart", function () { b.dragstart(c.mouse(this)) }).on("dragend", function () { b.dragend() }) : function () { }) }, i.generateEventRectsForMultipleXs = function (a) { function b() { c.svg.select("." + l.eventRect).style("cursor", null), c.hideXGridFocus(), c.hideTooltip(), c.unexpandCircles(), c.unexpandBars() } var c = this, d = c.d3, e = c.config; a.append("rect").attr("x", 0).attr("y", 0).attr("width", c.width).attr("height", c.height).attr("class", l.eventRect).on("mouseout", function () { c.config && (c.hasArcType() || b()) }).on("mousemove", function () { var a, f, g, h, i = c.filterTargetsToShow(c.data.targets); if (!c.dragging && !c.hasArcType(i)) { if (a = d.mouse(this), f = c.findClosestFromTargets(i, a), !c.mouseover || f && f.id === c.mouseover.id || (e.data_onmouseout.call(c.api, c.mouseover), c.mouseover = void 0), !f) return void b(); g = c.isScatterType(f) || !e.tooltip_grouped ? [f] : c.filterByX(i, f.x), h = g.map(function (a) { return c.addName(a) }), c.showTooltip(h, this), e.point_focus_expand_enabled && c.expandCircles(f.index, f.id, !0), c.expandBars(f.index, f.id, !0), c.showXGridFocus(h), (c.isBarType(f.id) || c.dist(f, a) < 100) && (c.svg.select("." + l.eventRect).style("cursor", "pointer"), c.mouseover || (e.data_onmouseover.call(c.api, f), c.mouseover = f)) } }).on("click", function () { var a, b, f = c.filterTargetsToShow(c.data.targets); c.hasArcType(f) || (a = d.mouse(this), b = c.findClosestFromTargets(f, a), b && (c.isBarType(b.id) || c.dist(b, a) < 100) && c.main.selectAll("." + l.shapes + c.getTargetSelectorSuffix(b.id)).selectAll("." + l.shape + "-" + b.index).each(function () { (e.data_selection_grouped || c.isWithinShape(this, b)) && (c.toggleShape(this, b, b.index), c.config.data_onclick.call(c.api, b, this)) })) }).call(e.data_selection_draggable && c.drag ? d.behavior.drag().origin(Object).on("drag", function () { c.drag(d.mouse(this)) }).on("dragstart", function () { c.dragstart(d.mouse(this)) }).on("dragend", function () { c.dragend() }) : function () { }) }, i.dispatchEvent = function (b, c, d) { var e = this, f = "." + l.eventRect + (e.isMultipleX() ? "" : "-" + c), g = e.main.select(f).node(), h = g.getBoundingClientRect(), i = h.left + (d ? d[0] : 0), j = h.top + (d ? d[1] : 0), k = document.createEvent("MouseEvents"); k.initMouseEvent(b, !0, !0, a, 0, i, j, i, j, !1, !1, !1, !1, 0, null), g.dispatchEvent(k) }, i.getCurrentWidth = function () { var a = this, b = a.config; return b.size_width ? b.size_width : a.getParentWidth() }, i.getCurrentHeight = function () { var a = this, b = a.config, c = b.size_height ? b.size_height : a.getParentHeight(); return c > 0 ? c : 320 / (a.hasType("gauge") ? 2 : 1) }, i.getCurrentPaddingTop = function () { var a = this.config; return m(a.padding_top) ? a.padding_top : 0 }, i.getCurrentPaddingBottom = function () { var a = this.config; return m(a.padding_bottom) ? a.padding_bottom : 0 }, i.getCurrentPaddingLeft = function (a) { var b = this, c = b.config; return m(c.padding_left) ? c.padding_left : c.axis_rotated ? c.axis_x_show ? Math.max(r(b.getAxisWidthByAxisId("x", a)), 40) : 1 : !c.axis_y_show || c.axis_y_inner ? b.axis.getYAxisLabelPosition().isOuter ? 30 : 1 : r(b.getAxisWidthByAxisId("y", a)) }, i.getCurrentPaddingRight = function () { var a = this, b = a.config, c = 10, d = a.isLegendRight ? a.getLegendWidth() + 20 : 0; return m(b.padding_right) ? b.padding_right + 1 : b.axis_rotated ? c + d : !b.axis_y2_show || b.axis_y2_inner ? 2 + d + (a.axis.getY2AxisLabelPosition().isOuter ? 20 : 0) : r(a.getAxisWidthByAxisId("y2")) + d }, i.getParentRectValue = function (a) { for (var b, c = this.selectChart.node(); c && "BODY" !== c.tagName;) { try { b = c.getBoundingClientRect()[a] } catch (d) { "width" === a && (b = c.offsetWidth) } if (b) break; c = c.parentNode } return b }, i.getParentWidth = function () { return this.getParentRectValue("width") }, i.getParentHeight = function () { var a = this.selectChart.style("height"); return a.indexOf("px") > 0 ? +a.replace("px", "") : 0 }, i.getSvgLeft = function (a) { var b = this, c = b.config, d = c.axis_rotated || !c.axis_rotated && !c.axis_y_inner, e = c.axis_rotated ? l.axisX : l.axisY, f = b.main.select("." + e).node(), g = f && d ? f.getBoundingClientRect() : { right: 0 }, h = b.selectChart.node().getBoundingClientRect(), i = b.hasArcType(), j = g.right - h.left - (i ? 0 : b.getCurrentPaddingLeft(a)); return j > 0 ? j : 0 }, i.getAxisWidthByAxisId = function (a, b) { var c = this, d = c.axis.getLabelPositionById(a); return c.axis.getMaxTickWidth(a, b) + (d.isInner ? 20 : 40) }, i.getHorizontalAxisHeight = function (a) { var b = this, c = b.config, d = 30; return "x" !== a || c.axis_x_show ? "x" === a && c.axis_x_height ? c.axis_x_height : "y" !== a || c.axis_y_show ? "y2" !== a || c.axis_y2_show ? ("x" === a && !c.axis_rotated && c.axis_x_tick_rotate && (d = 30 + b.axis.getMaxTickWidth(a) * Math.cos(Math.PI * (90 - c.axis_x_tick_rotate) / 180)), d + (b.axis.getLabelPositionById(a).isInner ? 0 : 10) + ("y2" === a ? -10 : 0)) : b.rotated_padding_top : !c.legend_show || b.isLegendRight || b.isLegendInset ? 1 : 10 : 8 }, i.getEventRectWidth = function () { return Math.max(0, this.xAxis.tickInterval()) }, i.getShapeIndices = function (a) { var b, c, d = this, e = d.config, f = {}, g = 0; return d.filterTargetsToShow(d.data.targets.filter(a, d)).forEach(function (a) { for (b = 0; b < e.data_groups.length; b++)if (!(e.data_groups[b].indexOf(a.id) < 0)) for (c = 0; c < e.data_groups[b].length; c++)if (e.data_groups[b][c] in f) { f[a.id] = f[e.data_groups[b][c]]; break } p(f[a.id]) && (f[a.id] = g++) }), f.__max__ = g - 1, f }, i.getShapeX = function (a, b, c, d) { var e = this, f = d ? e.subX : e.x; return function (d) { var e = d.id in c ? c[d.id] : 0; return d.x || 0 === d.x ? f(d.x) - a * (b / 2 - e) : 0 } }, i.getShapeY = function (a) { var b = this; return function (c) { var d = a ? b.getSubYScale(c.id) : b.getYScale(c.id); return d(c.value) } }, i.getShapeOffset = function (a, b, c) { var d = this, e = d.orderTargets(d.filterTargetsToShow(d.data.targets.filter(a, d))), f = e.map(function (a) { return a.id }); return function (a, g) { var h = c ? d.getSubYScale(a.id) : d.getYScale(a.id), i = h(0), j = i; return e.forEach(function (c) { var e = d.isStepType(a) ? d.convertValuesToStep(c.values) : c.values; c.id !== a.id && b[c.id] === b[a.id] && f.indexOf(c.id) < f.indexOf(a.id) && e[g].value * a.value >= 0 && (j += h(e[g].value) - i) }), j } }, i.isWithinShape = function (a, b) { var c, d = this, e = d.d3.select(a); return d.isTargetToShow(b.id) ? "circle" === a.nodeName ? c = d.isStepType(b) ? d.isWithinStep(a, d.getYScale(b.id)(b.value)) : d.isWithinCircle(a, 1.5 * d.pointSelectR(b)) : "path" === a.nodeName && (c = e.classed(l.bar) ? d.isWithinBar(a) : !0) : c = !1, c }, i.getInterpolate = function (a) { var b = this; return b.isSplineType(a) ? "cardinal" : b.isStepType(a) ? b.config.line_step_type : "linear" }, i.initLine = function () { var a = this; a.main.select("." + l.chart).append("g").attr("class", l.chartLines) }, i.updateTargetsForLine = function (a) { var b, c, d = this, e = d.config, f = d.classChartLine.bind(d), g = d.classLines.bind(d), h = d.classAreas.bind(d), i = d.classCircles.bind(d), j = d.classFocus.bind(d); b = d.main.select("." + l.chartLines).selectAll("." + l.chartLine).data(a).attr("class", function (a) { return f(a) + j(a) }), c = b.enter().append("g").attr("class", f).style("opacity", 0).style("pointer-events", "none"), c.append("g").attr("class", g), c.append("g").attr("class", h), c.append("g").attr("class", function (a) { return d.generateClass(l.selectedCircles, a.id) }), c.append("g").attr("class", i).style("cursor", function (a) { return e.data_selection_isselectable(a) ? "pointer" : null }), a.forEach(function (a) { d.main.selectAll("." + l.selectedCircles + d.getTargetSelectorSuffix(a.id)).selectAll("." + l.selectedCircle).each(function (b) { b.value = a.values[b.index].value }) }) }, i.updateLine = function (a) { var b = this; b.mainLine = b.main.selectAll("." + l.lines).selectAll("." + l.line).data(b.lineData.bind(b)), b.mainLine.enter().append("path").attr("class", b.classLine.bind(b)).style("stroke", b.color), b.mainLine.style("opacity", b.initialOpacity.bind(b)).style("shape-rendering", function (a) { return b.isStepType(a) ? "crispEdges" : "" }).attr("transform", null), b.mainLine.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawLine = function (a, b) { return [(b ? this.mainLine.transition() : this.mainLine).attr("d", a).style("stroke", this.color).style("opacity", 1)] }, i.generateDrawLine = function (a, b) { var c = this, d = c.config, e = c.d3.svg.line(), f = c.generateGetLinePoints(a, b), g = b ? c.getSubYScale : c.getYScale, h = function (a) { return (b ? c.subxx : c.xx).call(c, a) }, i = function (a, b) { return d.data_groups.length > 0 ? f(a, b)[0][1] : g.call(c, a.id)(a.value) }; return e = d.axis_rotated ? e.x(i).y(h) : e.x(h).y(i), d.line_connectNull || (e = e.defined(function (a) { return null != a.value })), function (a) { var f, h = d.line_connectNull ? c.filterRemoveNull(a.values) : a.values, i = b ? c.x : c.subX, j = g.call(c, a.id), k = 0, l = 0; return c.isLineType(a) ? d.data_regions[a.id] ? f = c.lineWithRegions(h, i, j, d.data_regions[a.id]) : (c.isStepType(a) && (h = c.convertValuesToStep(h)), f = e.interpolate(c.getInterpolate(a))(h)) : (h[0] && (k = i(h[0].x), l = j(h[0].value)), f = d.axis_rotated ? "M " + l + " " + k : "M " + k + " " + l), f ? f : "M 0 0" } }, i.generateGetLinePoints = function (a, b) { var c = this, d = c.config, e = a.__max__ + 1, f = c.getShapeX(0, e, a, !!b), g = c.getShapeY(!!b), h = c.getShapeOffset(c.isLineType, a, !!b), i = b ? c.getSubYScale : c.getYScale; return function (a, b) { var e = i.call(c, a.id)(0), j = h(a, b) || e, k = f(a), l = g(a); return d.axis_rotated && (0 < a.value && e > l || a.value < 0 && l > e) && (l = e), [[k, l - (e - j)], [k, l - (e - j)], [k, l - (e - j)], [k, l - (e - j)]] } }, i.lineWithRegions = function (a, b, c, d) { function e(a, b) { var c; for (c = 0; c < b.length; c++)if (b[c].start < a && a <= b[c].end) return !0; return !1 } function f(a) { return "M" + a[0][0] + " " + a[0][1] + " " + a[1][0] + " " + a[1][1] } var g, h, i, j, k, l, m, n, o, r, s, t, u = this, v = u.config, w = -1, x = "M", y = u.isCategorized() ? .5 : 0, z = []; if (q(d)) for (g = 0; g < d.length; g++)z[g] = {}, z[g].start = p(d[g].start) ? a[0].x : u.isTimeSeries() ? u.parseDate(d[g].start) : d[g].start, z[g].end = p(d[g].end) ? a[a.length - 1].x : u.isTimeSeries() ? u.parseDate(d[g].end) : d[g].end; for (s = v.axis_rotated ? function (a) { return c(a.value) } : function (a) { return b(a.x) }, t = v.axis_rotated ? function (a) { return b(a.x) } : function (a) { return c(a.value) }, i = u.isTimeSeries() ? function (a, d, e, g) { var h, i = a.x.getTime(), j = d.x - a.x, l = new Date(i + j * e), m = new Date(i + j * (e + g)); return h = v.axis_rotated ? [[c(k(e)), b(l)], [c(k(e + g)), b(m)]] : [[b(l), c(k(e))], [b(m), c(k(e + g))]], f(h) } : function (a, d, e, g) { var h; return h = v.axis_rotated ? [[c(k(e), !0), b(j(e))], [c(k(e + g), !0), b(j(e + g))]] : [[b(j(e), !0), c(k(e))], [b(j(e + g), !0), c(k(e + g))]], f(h) }, g = 0; g < a.length; g++) { if (p(z) || !e(a[g].x, z)) x += " " + s(a[g]) + " " + t(a[g]); else for (j = u.getScale(a[g - 1].x + y, a[g].x + y, u.isTimeSeries()), k = u.getScale(a[g - 1].value, a[g].value), l = b(a[g].x) - b(a[g - 1].x), m = c(a[g].value) - c(a[g - 1].value), n = Math.sqrt(Math.pow(l, 2) + Math.pow(m, 2)), o = 2 / n, r = 2 * o, h = o; 1 >= h; h += r)x += i(a[g - 1], a[g], h, o); w = a[g].x } return x }, i.updateArea = function (a) { var b = this, c = b.d3; b.mainArea = b.main.selectAll("." + l.areas).selectAll("." + l.area).data(b.lineData.bind(b)), b.mainArea.enter().append("path").attr("class", b.classArea.bind(b)).style("fill", b.color).style("opacity", function () { return b.orgAreaOpacity = +c.select(this).style("opacity"), 0 }), b.mainArea.style("opacity", b.orgAreaOpacity), b.mainArea.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawArea = function (a, b) { return [(b ? this.mainArea.transition() : this.mainArea).attr("d", a).style("fill", this.color).style("opacity", this.orgAreaOpacity)] }, i.generateDrawArea = function (a, b) { var c = this, d = c.config, e = c.d3.svg.area(), f = c.generateGetAreaPoints(a, b), g = b ? c.getSubYScale : c.getYScale, h = function (a) { return (b ? c.subxx : c.xx).call(c, a) }, i = function (a, b) { return d.data_groups.length > 0 ? f(a, b)[0][1] : g.call(c, a.id)(c.getAreaBaseValue(a.id)) }, j = function (a, b) { return d.data_groups.length > 0 ? f(a, b)[1][1] : g.call(c, a.id)(a.value) }; return e = d.axis_rotated ? e.x0(i).x1(j).y(h) : e.x(h).y0(i).y1(j), d.line_connectNull || (e = e.defined(function (a) { return null !== a.value })), function (a) { var b, f = d.line_connectNull ? c.filterRemoveNull(a.values) : a.values, g = 0, h = 0; return c.isAreaType(a) ? (c.isStepType(a) && (f = c.convertValuesToStep(f)), b = e.interpolate(c.getInterpolate(a))(f)) : (f[0] && (g = c.x(f[0].x), h = c.getYScale(a.id)(f[0].value)), b = d.axis_rotated ? "M " + h + " " + g : "M " + g + " " + h), b ? b : "M 0 0" } }, i.getAreaBaseValue = function () { return 0 }, i.generateGetAreaPoints = function (a, b) { var c = this, d = c.config, e = a.__max__ + 1, f = c.getShapeX(0, e, a, !!b), g = c.getShapeY(!!b), h = c.getShapeOffset(c.isAreaType, a, !!b), i = b ? c.getSubYScale : c.getYScale; return function (a, b) { var e = i.call(c, a.id)(0), j = h(a, b) || e, k = f(a), l = g(a); return d.axis_rotated && (0 < a.value && e > l || a.value < 0 && l > e) && (l = e), [[k, j], [k, l - (e - j)], [k, l - (e - j)], [k, j]] } }, i.updateCircle = function () { var a = this; a.mainCircle = a.main.selectAll("." + l.circles).selectAll("." + l.circle).data(a.lineOrScatterData.bind(a)), a.mainCircle.enter().append("circle").attr("class", a.classCircle.bind(a)).attr("r", a.pointR.bind(a)).style("fill", a.color), a.mainCircle.style("opacity", a.initialOpacityForCircle.bind(a)), a.mainCircle.exit().remove() }, i.redrawCircle = function (a, b, c) { var d = this.main.selectAll("." + l.selectedCircle); return [(c ? this.mainCircle.transition() : this.mainCircle).style("opacity", this.opacityForCircle.bind(this)).style("fill", this.color).attr("cx", a).attr("cy", b), (c ? d.transition() : d).attr("cx", a).attr("cy", b)] }, i.circleX = function (a) { return a.x || 0 === a.x ? this.x(a.x) : null }, i.updateCircleY = function () { var a, b, c = this; c.config.data_groups.length > 0 ? (a = c.getShapeIndices(c.isLineType), b = c.generateGetLinePoints(a), c.circleY = function (a, c) { return b(a, c)[0][1] }) : c.circleY = function (a) { return c.getYScale(a.id)(a.value) } }, i.getCircles = function (a, b) { var c = this; return (b ? c.main.selectAll("." + l.circles + c.getTargetSelectorSuffix(b)) : c.main).selectAll("." + l.circle + (m(a) ? "-" + a : "")) }, i.expandCircles = function (a, b, c) { var d = this, e = d.pointExpandedR.bind(d); c && d.unexpandCircles(), d.getCircles(a, b).classed(l.EXPANDED, !0).attr("r", e) }, i.unexpandCircles = function (a) { var b = this, c = b.pointR.bind(b); b.getCircles(a).filter(function () { return b.d3.select(this).classed(l.EXPANDED) }).classed(l.EXPANDED, !1).attr("r", c) }, i.pointR = function (a) { var b = this, c = b.config; return b.isStepType(a) ? 0 : n(c.point_r) ? c.point_r(a) : c.point_r }, i.pointExpandedR = function (a) { var b = this, c = b.config; return c.point_focus_expand_enabled ? c.point_focus_expand_r ? c.point_focus_expand_r : 1.75 * b.pointR(a) : b.pointR(a) }, i.pointSelectR = function (a) { var b = this, c = b.config; return c.point_select_r ? c.point_select_r : 4 * b.pointR(a) }, i.isWithinCircle = function (a, b) { var c = this.d3, d = c.mouse(a), e = c.select(a), f = +e.attr("cx"), g = +e.attr("cy"); return Math.sqrt(Math.pow(f - d[0], 2) + Math.pow(g - d[1], 2)) < b }, i.isWithinStep = function (a, b) { return Math.abs(b - this.d3.mouse(a)[1]) < 30 }, i.initBar = function () { var a = this; a.main.select("." + l.chart).append("g").attr("class", l.chartBars) }, i.updateTargetsForBar = function (a) { var b, c, d = this, e = d.config, f = d.classChartBar.bind(d), g = d.classBars.bind(d), h = d.classFocus.bind(d); b = d.main.select("." + l.chartBars).selectAll("." + l.chartBar).data(a).attr("class", function (a) { return f(a) + h(a) }), c = b.enter().append("g").attr("class", f).style("opacity", 0).style("pointer-events", "none"), c.append("g").attr("class", g).style("cursor", function (a) { return e.data_selection_isselectable(a) ? "pointer" : null }) }, i.updateBar = function (a) { var b = this, c = b.barData.bind(b), d = b.classBar.bind(b), e = b.initialOpacity.bind(b), f = function (a) { return b.color(a.id) }; b.mainBar = b.main.selectAll("." + l.bars).selectAll("." + l.bar).data(c), b.mainBar.enter().append("path").attr("class", d).style("stroke", f).style("fill", f), b.mainBar.style("opacity", e), b.mainBar.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawBar = function (a, b) { return [(b ? this.mainBar.transition() : this.mainBar).attr("d", a).style("fill", this.color).style("opacity", 1)] }, i.getBarW = function (a, b) { var c = this, d = c.config, e = "number" == typeof d.bar_width ? d.bar_width : b ? a.tickInterval() * d.bar_width_ratio / b : 0; return d.bar_width_max && e > d.bar_width_max ? d.bar_width_max : e }, i.getBars = function (a, b) { var c = this; return (b ? c.main.selectAll("." + l.bars + c.getTargetSelectorSuffix(b)) : c.main).selectAll("." + l.bar + (m(a) ? "-" + a : "")) }, i.expandBars = function (a, b, c) { var d = this; c && d.unexpandBars(), d.getBars(a, b).classed(l.EXPANDED, !0) }, i.unexpandBars = function (a) { var b = this; b.getBars(a).classed(l.EXPANDED, !1) }, i.generateDrawBar = function (a, b) { var c = this, d = c.config, e = c.generateGetBarPoints(a, b); return function (a, b) { var c = e(a, b), f = d.axis_rotated ? 1 : 0, g = d.axis_rotated ? 0 : 1, h = "M " + c[0][f] + "," + c[0][g] + " L" + c[1][f] + "," + c[1][g] + " L" + c[2][f] + "," + c[2][g] + " L" + c[3][f] + "," + c[3][g] + " z"; return h } }, i.generateGetBarPoints = function (a, b) {
		var c = this, d = b ? c.subXAxis : c.xAxis, e = a.__max__ + 1, f = c.getBarW(d, e), g = c.getShapeX(f, e, a, !!b), h = c.getShapeY(!!b), i = c.getShapeOffset(c.isBarType, a, !!b), j = b ? c.getSubYScale : c.getYScale;
		return function (a, b) { var d = j.call(c, a.id)(0), e = i(a, b) || d, k = g(a), l = h(a); return c.config.axis_rotated && (0 < a.value && d > l || a.value < 0 && l > d) && (l = d), [[k, e], [k, l - (d - e)], [k + f, l - (d - e)], [k + f, e]] }
	}, i.isWithinBar = function (a) { var b = this.d3.mouse(a), c = a.getBoundingClientRect(), d = a.pathSegList.getItem(0), e = a.pathSegList.getItem(1), f = Math.min(d.x, e.x), g = Math.min(d.y, e.y), h = c.width, i = c.height, j = 2, k = f - j, l = f + h + j, m = g + i + j, n = g - j; return k < b[0] && b[0] < l && n < b[1] && b[1] < m }, i.initText = function () { var a = this; a.main.select("." + l.chart).append("g").attr("class", l.chartTexts), a.mainText = a.d3.selectAll([]) }, i.updateTargetsForText = function (a) { var b, c, d = this, e = d.classChartText.bind(d), f = d.classTexts.bind(d), g = d.classFocus.bind(d); b = d.main.select("." + l.chartTexts).selectAll("." + l.chartText).data(a).attr("class", function (a) { return e(a) + g(a) }), c = b.enter().append("g").attr("class", e).style("opacity", 0).style("pointer-events", "none"), c.append("g").attr("class", f) }, i.updateText = function (a) { var b = this, c = b.config, d = b.barOrLineData.bind(b), e = b.classText.bind(b); b.mainText = b.main.selectAll("." + l.texts).selectAll("." + l.text).data(d), b.mainText.enter().append("text").attr("class", e).attr("text-anchor", function (a) { return c.axis_rotated ? a.value < 0 ? "end" : "start" : "middle" }).style("stroke", "none").style("fill", function (a) { return b.color(a) }).style("fill-opacity", 0), b.mainText.text(function (a, c, d) { return b.dataLabelFormat(a.id)(a.value, a.id, c, d) }), b.mainText.exit().transition().duration(a).style("fill-opacity", 0).remove() }, i.redrawText = function (a, b, c, d) { return [(d ? this.mainText.transition() : this.mainText).attr("x", a).attr("y", b).style("fill", this.color).style("fill-opacity", c ? 0 : this.opacityForText.bind(this))] }, i.getTextRect = function (a, b) { var c, d = this.d3.select("body").append("div").classed("c3", !0), e = d.append("svg").style("visibility", "hidden").style("position", "fixed").style("top", 0).style("left", 0); return e.selectAll(".dummy").data([a]).enter().append("text").classed(b ? b : "", !0).text(a).each(function () { c = this.getBoundingClientRect() }), d.remove(), c }, i.generateXYForText = function (a, b, c, d) { var e = this, f = e.generateGetAreaPoints(a, !1), g = e.generateGetBarPoints(b, !1), h = e.generateGetLinePoints(c, !1), i = d ? e.getXForText : e.getYForText; return function (a, b) { var c = e.isAreaType(a) ? f : e.isBarType(a) ? g : h; return i.call(e, c(a, b), a, this) } }, i.getXForText = function (a, b, c) { var d, e, f = this, g = c.getBoundingClientRect(); return f.config.axis_rotated ? (e = f.isBarType(b) ? 4 : 6, d = a[2][1] + e * (b.value < 0 ? -1 : 1)) : d = f.hasType("bar") ? (a[2][0] + a[0][0]) / 2 : a[0][0], null === b.value && (d > f.width ? d = f.width - g.width : 0 > d && (d = 4)), d }, i.getYForText = function (a, b, c) { var d, e = this, f = c.getBoundingClientRect(); return e.config.axis_rotated ? d = (a[0][0] + a[2][0] + .6 * f.height) / 2 : (d = a[2][1], b.value < 0 ? (d += f.height, e.isBarType(b) && e.isSafari() ? d -= 3 : !e.isBarType(b) && e.isChrome() && (d += 3)) : d += e.isBarType(b) ? -3 : -6), null !== b.value || e.config.axis_rotated || (d < f.height ? d = f.height : d > this.height && (d = this.height - 4)), d }, i.setTargetType = function (a, b) { var c = this, d = c.config; c.mapToTargetIds(a).forEach(function (a) { c.withoutFadeIn[a] = b === d.data_types[a], d.data_types[a] = b }), a || (d.data_type = b) }, i.hasType = function (a, b) { var c = this, d = c.config.data_types, e = !1; return b = b || c.data.targets, b && b.length ? b.forEach(function (b) { var c = d[b.id]; (c && c.indexOf(a) >= 0 || !c && "line" === a) && (e = !0) }) : Object.keys(d).length ? Object.keys(d).forEach(function (b) { d[b] === a && (e = !0) }) : e = c.config.data_type === a, e }, i.hasArcType = function (a) { return this.hasType("pie", a) || this.hasType("donut", a) || this.hasType("gauge", a) }, i.isLineType = function (a) { var b = this.config, c = o(a) ? a : a.id; return !b.data_types[c] || ["line", "spline", "area", "area-spline", "step", "area-step"].indexOf(b.data_types[c]) >= 0 }, i.isStepType = function (a) { var b = o(a) ? a : a.id; return ["step", "area-step"].indexOf(this.config.data_types[b]) >= 0 }, i.isSplineType = function (a) { var b = o(a) ? a : a.id; return ["spline", "area-spline"].indexOf(this.config.data_types[b]) >= 0 }, i.isAreaType = function (a) { var b = o(a) ? a : a.id; return ["area", "area-spline", "area-step"].indexOf(this.config.data_types[b]) >= 0 }, i.isBarType = function (a) { var b = o(a) ? a : a.id; return "bar" === this.config.data_types[b] }, i.isScatterType = function (a) { var b = o(a) ? a : a.id; return "scatter" === this.config.data_types[b] }, i.isPieType = function (a) { var b = o(a) ? a : a.id; return "pie" === this.config.data_types[b] }, i.isGaugeType = function (a) { var b = o(a) ? a : a.id; return "gauge" === this.config.data_types[b] }, i.isDonutType = function (a) { var b = o(a) ? a : a.id; return "donut" === this.config.data_types[b] }, i.isArcType = function (a) { return this.isPieType(a) || this.isDonutType(a) || this.isGaugeType(a) }, i.lineData = function (a) { return this.isLineType(a) ? [a] : [] }, i.arcData = function (a) { return this.isArcType(a.data) ? [a] : [] }, i.barData = function (a) { return this.isBarType(a) ? a.values : [] }, i.lineOrScatterData = function (a) { return this.isLineType(a) || this.isScatterType(a) ? a.values : [] }, i.barOrLineData = function (a) { return this.isBarType(a) || this.isLineType(a) ? a.values : [] }, i.initGrid = function () { var a = this, b = a.config, c = a.d3; a.grid = a.main.append("g").attr("clip-path", a.clipPathForGrid).attr("class", l.grid), b.grid_x_show && a.grid.append("g").attr("class", l.xgrids), b.grid_y_show && a.grid.append("g").attr("class", l.ygrids), b.grid_focus_show && a.grid.append("g").attr("class", l.xgridFocus).append("line").attr("class", l.xgridFocus), a.xgrid = c.selectAll([]), b.grid_lines_front || a.initGridLines() }, i.initGridLines = function () { var a = this, b = a.d3; a.gridLines = a.main.append("g").attr("clip-path", a.clipPathForGrid).attr("class", l.grid + " " + l.gridLines), a.gridLines.append("g").attr("class", l.xgridLines), a.gridLines.append("g").attr("class", l.ygridLines), a.xgridLines = b.selectAll([]) }, i.updateXGrid = function (a) { var b = this, c = b.config, d = b.d3, e = b.generateGridData(c.grid_x_type, b.x), f = b.isCategorized() ? b.xAxis.tickOffset() : 0; b.xgridAttr = c.axis_rotated ? { x1: 0, x2: b.width, y1: function (a) { return b.x(a) - f }, y2: function (a) { return b.x(a) - f } } : { x1: function (a) { return b.x(a) + f }, x2: function (a) { return b.x(a) + f }, y1: 0, y2: b.height }, b.xgrid = b.main.select("." + l.xgrids).selectAll("." + l.xgrid).data(e), b.xgrid.enter().append("line").attr("class", l.xgrid), a || b.xgrid.attr(b.xgridAttr).style("opacity", function () { return +d.select(this).attr(c.axis_rotated ? "y1" : "x1") === (c.axis_rotated ? b.height : 0) ? 0 : 1 }), b.xgrid.exit().remove() }, i.updateYGrid = function () { var a = this, b = a.config, c = a.yAxis.tickValues() || a.y.ticks(b.grid_y_ticks); a.ygrid = a.main.select("." + l.ygrids).selectAll("." + l.ygrid).data(c), a.ygrid.enter().append("line").attr("class", l.ygrid), a.ygrid.attr("x1", b.axis_rotated ? a.y : 0).attr("x2", b.axis_rotated ? a.y : a.width).attr("y1", b.axis_rotated ? 0 : a.y).attr("y2", b.axis_rotated ? a.height : a.y), a.ygrid.exit().remove(), a.smoothLines(a.ygrid, "grid") }, i.gridTextAnchor = function (a) { return a.position ? a.position : "end" }, i.gridTextDx = function (a) { return "start" === a.position ? 4 : "middle" === a.position ? 0 : -4 }, i.xGridTextX = function (a) { return "start" === a.position ? -this.height : "middle" === a.position ? -this.height / 2 : 0 }, i.yGridTextX = function (a) { return "start" === a.position ? 0 : "middle" === a.position ? this.width / 2 : this.width }, i.updateGrid = function (a) { var b, c, d, e = this, f = e.main, g = e.config; e.grid.style("visibility", e.hasArcType() ? "hidden" : "visible"), f.select("line." + l.xgridFocus).style("visibility", "hidden"), g.grid_x_show && e.updateXGrid(), e.xgridLines = f.select("." + l.xgridLines).selectAll("." + l.xgridLine).data(g.grid_x_lines), b = e.xgridLines.enter().append("g").attr("class", function (a) { return l.xgridLine + (a["class"] ? " " + a["class"] : "") }), b.append("line").style("opacity", 0), b.append("text").attr("text-anchor", e.gridTextAnchor).attr("transform", g.axis_rotated ? "" : "rotate(-90)").attr("dx", e.gridTextDx).attr("dy", -5).style("opacity", 0), e.xgridLines.exit().transition().duration(a).style("opacity", 0).remove(), g.grid_y_show && e.updateYGrid(), e.ygridLines = f.select("." + l.ygridLines).selectAll("." + l.ygridLine).data(g.grid_y_lines), c = e.ygridLines.enter().append("g").attr("class", function (a) { return l.ygridLine + (a["class"] ? " " + a["class"] : "") }), c.append("line").style("opacity", 0), c.append("text").attr("text-anchor", e.gridTextAnchor).attr("transform", g.axis_rotated ? "rotate(-90)" : "").attr("dx", e.gridTextDx).attr("dy", -5).style("opacity", 0), d = e.yv.bind(e), e.ygridLines.select("line").transition().duration(a).attr("x1", g.axis_rotated ? d : 0).attr("x2", g.axis_rotated ? d : e.width).attr("y1", g.axis_rotated ? 0 : d).attr("y2", g.axis_rotated ? e.height : d).style("opacity", 1), e.ygridLines.select("text").transition().duration(a).attr("x", g.axis_rotated ? e.xGridTextX.bind(e) : e.yGridTextX.bind(e)).attr("y", d).text(function (a) { return a.text }).style("opacity", 1), e.ygridLines.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawGrid = function (a) { var b = this, c = b.config, d = b.xv.bind(b), e = b.xgridLines.select("line"), f = b.xgridLines.select("text"); return [(a ? e.transition() : e).attr("x1", c.axis_rotated ? 0 : d).attr("x2", c.axis_rotated ? b.width : d).attr("y1", c.axis_rotated ? d : 0).attr("y2", c.axis_rotated ? d : b.height).style("opacity", 1), (a ? f.transition() : f).attr("x", c.axis_rotated ? b.yGridTextX.bind(b) : b.xGridTextX.bind(b)).attr("y", d).text(function (a) { return a.text }).style("opacity", 1)] }, i.showXGridFocus = function (a) { var b = this, c = b.config, d = a.filter(function (a) { return a && m(a.value) }), e = b.main.selectAll("line." + l.xgridFocus), f = b.xx.bind(b); c.tooltip_show && (b.hasType("scatter") || b.hasArcType() || (e.style("visibility", "visible").data([d[0]]).attr(c.axis_rotated ? "y1" : "x1", f).attr(c.axis_rotated ? "y2" : "x2", f), b.smoothLines(e, "grid"))) }, i.hideXGridFocus = function () { this.main.select("line." + l.xgridFocus).style("visibility", "hidden") }, i.updateXgridFocus = function () { var a = this, b = a.config; a.main.select("line." + l.xgridFocus).attr("x1", b.axis_rotated ? 0 : -10).attr("x2", b.axis_rotated ? a.width : -10).attr("y1", b.axis_rotated ? -10 : 0).attr("y2", b.axis_rotated ? -10 : a.height) }, i.generateGridData = function (a, b) { var c, d, e, f, g = this, h = [], i = g.main.select("." + l.axisX).selectAll(".tick").size(); if ("year" === a) for (c = g.getXDomain(), d = c[0].getFullYear(), e = c[1].getFullYear(), f = d; e >= f; f++)h.push(new Date(f + "-01-01 00:00:00")); else h = b.ticks(10), h.length > i && (h = h.filter(function (a) { return ("" + a).indexOf(".") < 0 })); return h }, i.getGridFilterToRemove = function (a) { return a ? function (b) { var c = !1; return [].concat(a).forEach(function (a) { ("value" in a && b.value === a.value || "class" in a && b["class"] === a["class"]) && (c = !0) }), c } : function () { return !0 } }, i.removeGridLines = function (a, b) { var c = this, d = c.config, e = c.getGridFilterToRemove(a), f = function (a) { return !e(a) }, g = b ? l.xgridLines : l.ygridLines, h = b ? l.xgridLine : l.ygridLine; c.main.select("." + g).selectAll("." + h).filter(e).transition().duration(d.transition_duration).style("opacity", 0).remove(), b ? d.grid_x_lines = d.grid_x_lines.filter(f) : d.grid_y_lines = d.grid_y_lines.filter(f) }, i.initTooltip = function () { var a, b = this, c = b.config; if (b.tooltip = b.selectChart.style("position", "relative").append("div").attr("class", l.tooltipContainer).style("position", "absolute").style("pointer-events", "none").style("display", "none"), c.tooltip_init_show) { if (b.isTimeSeries() && o(c.tooltip_init_x)) { for (c.tooltip_init_x = b.parseDate(c.tooltip_init_x), a = 0; a < b.data.targets[0].values.length && b.data.targets[0].values[a].x - c.tooltip_init_x !== 0; a++); c.tooltip_init_x = a } b.tooltip.html(c.tooltip_contents.call(b, b.data.targets.map(function (a) { return b.addName(a.values[c.tooltip_init_x]) }), b.axis.getXAxisTickFormat(), b.getYFormat(b.hasArcType()), b.color)), b.tooltip.style("top", c.tooltip_init_position.top).style("left", c.tooltip_init_position.left).style("display", "block") } }, i.getTooltipContent = function (a, b, c, d) { var e, f, g, h, i, j, k = this, m = k.config, n = m.tooltip_format_title || b, o = m.tooltip_format_name || function (a) { return a }, p = m.tooltip_format_value || c; for (f = 0; f < a.length; f++)a[f] && (a[f].value || 0 === a[f].value) && (e || (g = n ? n(a[f].x) : a[f].x, e = "<table class='" + l.tooltip + "'>" + (g || 0 === g ? "<tr><th colspan='2'>" + g + "</th></tr>" : "")), h = p(a[f].value, a[f].ratio, a[f].id, a[f].index), void 0 !== h && (i = o(a[f].name, a[f].ratio, a[f].id, a[f].index), j = k.levelColor ? k.levelColor(a[f].value) : d(a[f].id), e += "<tr class='" + l.tooltipName + "-" + a[f].id + "'>", e += "<td class='name'><span style='background-color:" + j + "'></span>" + i + "</td>", e += "<td class='value'>" + h + "</td>", e += "</tr>")); return e + "</table>" }, i.tooltipPosition = function (a, b, c, d) { var e, f, g, h, i, j = this, k = j.config, l = j.d3, m = j.hasArcType(), n = l.mouse(d); return m ? (f = (j.width - (j.isLegendRight ? j.getLegendWidth() : 0)) / 2 + n[0], h = j.height / 2 + n[1] + 20) : (e = j.getSvgLeft(!0), k.axis_rotated ? (f = e + n[0] + 100, g = f + b, i = j.currentWidth - j.getCurrentPaddingRight(), h = j.x(a[0].x) + 20) : (f = e + j.getCurrentPaddingLeft(!0) + j.x(a[0].x) + 20, g = f + b, i = e + j.currentWidth - j.getCurrentPaddingRight(), h = n[1] + 15), g > i && (f -= g - i + 20), h + c > j.currentHeight && (h -= c + 30)), 0 > h && (h = 0), { top: h, left: f } }, i.showTooltip = function (a, b) { var c, d, e, f = this, g = f.config, h = f.hasArcType(), j = a.filter(function (a) { return a && m(a.value) }), k = g.tooltip_position || i.tooltipPosition; 0 !== j.length && g.tooltip_show && (f.tooltip.html(g.tooltip_contents.call(f, a, f.axis.getXAxisTickFormat(), f.getYFormat(h), f.color)).style("display", "block"), c = f.tooltip.property("offsetWidth"), d = f.tooltip.property("offsetHeight"), e = k.call(this, j, c, d, b), f.tooltip.style("top", e.top + "px").style("left", e.left + "px")) }, i.hideTooltip = function () { this.tooltip.style("display", "none") }, i.initLegend = function () { var a = this; return a.legendItemTextBox = {}, a.legendHasRendered = !1, a.legend = a.svg.append("g").attr("transform", a.getTranslate("legend")), a.config.legend_show ? void a.updateLegendWithDefaults() : (a.legend.style("visibility", "hidden"), void (a.hiddenLegendIds = a.mapToIds(a.data.targets))) }, i.updateLegendWithDefaults = function () { var a = this; a.updateLegend(a.mapToIds(a.data.targets), { withTransform: !1, withTransitionForTransform: !1, withTransition: !1 }) }, i.updateSizeForLegend = function (a, b) { var c = this, d = c.config, e = { top: c.isLegendTop ? c.getCurrentPaddingTop() + d.legend_inset_y + 5.5 : c.currentHeight - a - c.getCurrentPaddingBottom() - d.legend_inset_y, left: c.isLegendLeft ? c.getCurrentPaddingLeft() + d.legend_inset_x + .5 : c.currentWidth - b - c.getCurrentPaddingRight() - d.legend_inset_x + .5 }; c.margin3 = { top: c.isLegendRight ? 0 : c.isLegendInset ? e.top : c.currentHeight - a, right: 0 / 0, bottom: 0, left: c.isLegendRight ? c.currentWidth - b : c.isLegendInset ? e.left : 0 } }, i.transformLegend = function (a) { var b = this; (a ? b.legend.transition() : b.legend).attr("transform", b.getTranslate("legend")) }, i.updateLegendStep = function (a) { this.legendStep = a }, i.updateLegendItemWidth = function (a) { this.legendItemWidth = a }, i.updateLegendItemHeight = function (a) { this.legendItemHeight = a }, i.getLegendWidth = function () { var a = this; return a.config.legend_show ? a.isLegendRight || a.isLegendInset ? a.legendItemWidth * (a.legendStep + 1) : a.currentWidth : 0 }, i.getLegendHeight = function () { var a = this, b = 0; return a.config.legend_show && (b = a.isLegendRight ? a.currentHeight : Math.max(20, a.legendItemHeight) * (a.legendStep + 1)), b }, i.opacityForLegend = function (a) { return a.classed(l.legendItemHidden) ? null : 1 }, i.opacityForUnfocusedLegend = function (a) { return a.classed(l.legendItemHidden) ? null : .3 }, i.toggleFocusLegend = function (a, b) { var c = this; a = c.mapToTargetIds(a), c.legend.selectAll("." + l.legendItem).filter(function (b) { return a.indexOf(b) >= 0 }).classed(l.legendItemFocused, b).transition().duration(100).style("opacity", function () { var a = b ? c.opacityForLegend : c.opacityForUnfocusedLegend; return a.call(c, c.d3.select(this)) }) }, i.revertLegend = function () { var a = this, b = a.d3; a.legend.selectAll("." + l.legendItem).classed(l.legendItemFocused, !1).transition().duration(100).style("opacity", function () { return a.opacityForLegend(b.select(this)) }) }, i.showLegend = function (a) { var b = this, c = b.config; c.legend_show || (c.legend_show = !0, b.legend.style("visibility", "visible"), b.legendHasRendered || b.updateLegendWithDefaults()), b.removeHiddenLegendIds(a), b.legend.selectAll(b.selectorLegends(a)).style("visibility", "visible").transition().style("opacity", function () { return b.opacityForLegend(b.d3.select(this)) }) }, i.hideLegend = function (a) { var b = this, c = b.config; c.legend_show && u(a) && (c.legend_show = !1, b.legend.style("visibility", "hidden")), b.addHiddenLegendIds(a), b.legend.selectAll(b.selectorLegends(a)).style("opacity", 0).style("visibility", "hidden") }, i.clearLegendItemTextBoxCache = function () { this.legendItemTextBox = {} }, i.updateLegend = function (a, b, c) { function d(a, b) { return u.legendItemTextBox[b] || (u.legendItemTextBox[b] = u.getTextRect(a.textContent, l.legendItem)), u.legendItemTextBox[b] } function e(b, c, e) { function f(a, b) { b || (g = (o - D - n) / 2, B > g && (g = (o - n) / 2, D = 0, J++)), I[a] = J, H[J] = u.isLegendInset ? 10 : g, E[a] = D, D += n } var g, h, i = 0 === e, j = e === a.length - 1, k = d(b, c), l = k.width + C + (!j || u.isLegendRight || u.isLegendInset ? y : 0), m = k.height + x, n = u.isLegendRight || u.isLegendInset ? m : l, o = u.isLegendRight || u.isLegendInset ? u.getLegendHeight() : u.getLegendWidth(); return i && (D = 0, J = 0, z = 0, A = 0), v.legend_show && !u.isLegendToShow(c) ? void (F[c] = G[c] = I[c] = E[c] = 0) : (F[c] = l, G[c] = m, (!z || l >= z) && (z = l), (!A || m >= A) && (A = m), h = u.isLegendRight || u.isLegendInset ? A : z, void (v.legend_equally ? (Object.keys(F).forEach(function (a) { F[a] = z }), Object.keys(G).forEach(function (a) { G[a] = A }), g = (o - h * a.length) / 2, B > g ? (D = 0, J = 0, a.forEach(function (a) { f(a) })) : f(c, !0)) : f(c))) } var f, g, h, i, j, k, m, n, o, p, r, s, t, u = this, v = u.config, x = 4, y = 10, z = 0, A = 0, B = 10, C = 15, D = 0, E = {}, F = {}, G = {}, H = [0], I = {}, J = 0; b = b || {}, n = w(b, "withTransition", !0), o = w(b, "withTransitionForTransform", !0), u.isLegendInset && (J = v.legend_inset_step ? v.legend_inset_step : a.length, u.updateLegendStep(J)), u.isLegendRight ? (f = function (a) { return z * I[a] }, i = function (a) { return H[I[a]] + E[a] }) : u.isLegendInset ? (f = function (a) { return z * I[a] + 10 }, i = function (a) { return H[I[a]] + E[a] }) : (f = function (a) { return H[I[a]] + E[a] }, i = function (a) { return A * I[a] }), g = function (a, b) { return f(a, b) + 14 }, j = function (a, b) { return i(a, b) + 9 }, h = function (a, b) { return f(a, b) }, k = function (a, b) { return i(a, b) - 5 }, m = u.legend.selectAll("." + l.legendItem).data(a).enter().append("g").attr("class", function (a) { return u.generateClass(l.legendItem, a) }).style("visibility", function (a) { return u.isLegendToShow(a) ? "visible" : "hidden" }).style("cursor", "pointer").on("click", function (a) { v.legend_item_onclick ? v.legend_item_onclick.call(u, a) : u.d3.event.altKey ? (u.api.hide(), u.api.show(a)) : (u.api.toggle(a), u.isTargetToShow(a) ? u.api.focus(a) : u.api.revert()) }).on("mouseover", function (a) { u.d3.select(this).classed(l.legendItemFocused, !0), !u.transiting && u.isTargetToShow(a) && u.api.focus(a), v.legend_item_onmouseover && v.legend_item_onmouseover.call(u, a) }).on("mouseout", function (a) { u.d3.select(this).classed(l.legendItemFocused, !1), u.api.revert(), v.legend_item_onmouseout && v.legend_item_onmouseout.call(u, a) }), m.append("text").text(function (a) { return q(v.data_names[a]) ? v.data_names[a] : a }).each(function (a, b) { e(this, a, b) }).style("pointer-events", "none").attr("x", u.isLegendRight || u.isLegendInset ? g : -200).attr("y", u.isLegendRight || u.isLegendInset ? -200 : j), m.append("rect").attr("class", l.legendItemEvent).style("fill-opacity", 0).attr("x", u.isLegendRight || u.isLegendInset ? h : -200).attr("y", u.isLegendRight || u.isLegendInset ? -200 : k), m.append("rect").attr("class", l.legendItemTile).style("pointer-events", "none").style("fill", u.color).attr("x", u.isLegendRight || u.isLegendInset ? g : -200).attr("y", u.isLegendRight || u.isLegendInset ? -200 : i).attr("width", 10).attr("height", 10), t = u.legend.select("." + l.legendBackground + " rect"), u.isLegendInset && z > 0 && 0 === t.size() && (t = u.legend.insert("g", "." + l.legendItem).attr("class", l.legendBackground).append("rect")), p = u.legend.selectAll("text").data(a).text(function (a) { return q(v.data_names[a]) ? v.data_names[a] : a }).each(function (a, b) { e(this, a, b) }), (n ? p.transition() : p).attr("x", g).attr("y", j), r = u.legend.selectAll("rect." + l.legendItemEvent).data(a), (n ? r.transition() : r).attr("width", function (a) { return F[a] }).attr("height", function (a) { return G[a] }).attr("x", h).attr("y", k), s = u.legend.selectAll("rect." + l.legendItemTile).data(a), (n ? s.transition() : s).style("fill", u.color).attr("x", f).attr("y", i), t && (n ? t.transition() : t).attr("height", u.getLegendHeight() - 12).attr("width", z * (J + 1) + 10), u.legend.selectAll("." + l.legendItem).classed(l.legendItemHidden, function (a) { return !u.isTargetToShow(a) }), u.updateLegendItemWidth(z), u.updateLegendItemHeight(A), u.updateLegendStep(J), u.updateSizes(), u.updateScales(), u.updateSvgSize(), u.transformAll(o, c), u.legendHasRendered = !0 }, c(b, f), f.prototype.init = function () { var a = this.owner, b = a.config, c = a.main; a.axes.x = c.append("g").attr("class", l.axis + " " + l.axisX).attr("clip-path", a.clipPathForXAxis).attr("transform", a.getTranslate("x")).style("visibility", b.axis_x_show ? "visible" : "hidden"), a.axes.x.append("text").attr("class", l.axisXLabel).attr("transform", b.axis_rotated ? "rotate(-90)" : "").style("text-anchor", this.textAnchorForXAxisLabel.bind(this)), a.axes.y = c.append("g").attr("class", l.axis + " " + l.axisY).attr("clip-path", b.axis_y_inner ? "" : a.clipPathForYAxis).attr("transform", a.getTranslate("y")).style("visibility", b.axis_y_show ? "visible" : "hidden"), a.axes.y.append("text").attr("class", l.axisYLabel).attr("transform", b.axis_rotated ? "" : "rotate(-90)").style("text-anchor", this.textAnchorForYAxisLabel.bind(this)), a.axes.y2 = c.append("g").attr("class", l.axis + " " + l.axisY2).attr("transform", a.getTranslate("y2")).style("visibility", b.axis_y2_show ? "visible" : "hidden"), a.axes.y2.append("text").attr("class", l.axisY2Label).attr("transform", b.axis_rotated ? "" : "rotate(-90)").style("text-anchor", this.textAnchorForY2AxisLabel.bind(this)) }, f.prototype.getXAxis = function (a, b, c, d, e, f, h) { var i = this.owner, j = i.config, k = { isCategory: i.isCategorized(), withOuterTick: e, tickMultiline: j.axis_x_tick_multiline, tickWidth: j.axis_x_tick_width, tickTextRotate: h ? 0 : j.axis_x_tick_rotate, withoutTransition: f }, l = g(i.d3, k).scale(a).orient(b); return i.isTimeSeries() && d && (d = d.map(function (a) { return i.parseDate(a) })), l.tickFormat(c).tickValues(d), i.isCategorized() && (l.tickCentered(j.axis_x_tick_centered), u(j.axis_x_tick_culling) && (j.axis_x_tick_culling = !1)), l }, f.prototype.updateXAxisTickValues = function (a, b) { var c, d = this.owner, e = d.config; return (e.axis_x_tick_fit || e.axis_x_tick_count) && (c = this.generateTickValues(d.mapTargetsToUniqueXs(a), e.axis_x_tick_count, d.isTimeSeries())), b ? b.tickValues(c) : (d.xAxis.tickValues(c), d.subXAxis.tickValues(c)), c }, f.prototype.getYAxis = function (a, b, c, d, e, f) { var h = { withOuterTick: e, withoutTransition: f }, i = this.owner, j = i.d3, k = i.config, l = g(j, h).scale(a).orient(b).tickFormat(c); return i.isTimeSeriesY() ? l.ticks(j.time[k.axis_y_tick_time_value], k.axis_y_tick_time_interval) : l.tickValues(d), l }, f.prototype.getId = function (a) { var b = this.owner.config; return a in b.data_axes ? b.data_axes[a] : "y" }, f.prototype.getXAxisTickFormat = function () { var a = this.owner, b = a.config, c = a.isTimeSeries() ? a.defaultAxisTimeFormat : a.isCategorized() ? a.categoryName : function (a) { return 0 > a ? a.toFixed(0) : a }; return b.axis_x_tick_format && (n(b.axis_x_tick_format) ? c = b.axis_x_tick_format : a.isTimeSeries() && (c = function (c) { return c ? a.axisTimeFormat(b.axis_x_tick_format)(c) : "" })), n(c) ? function (b) { return c.call(a, b) } : c }, f.prototype.getTickValues = function (a, b) { return a ? a : b ? b.tickValues() : void 0 }, f.prototype.getXAxisTickValues = function () { return this.getTickValues(this.owner.config.axis_x_tick_values, this.owner.xAxis) }, f.prototype.getYAxisTickValues = function () { return this.getTickValues(this.owner.config.axis_y_tick_values, this.owner.yAxis) }, f.prototype.getY2AxisTickValues = function () { return this.getTickValues(this.owner.config.axis_y2_tick_values, this.owner.y2Axis) }, f.prototype.getLabelOptionByAxisId = function (a) { var b, c = this.owner, d = c.config; return "y" === a ? b = d.axis_y_label : "y2" === a ? b = d.axis_y2_label : "x" === a && (b = d.axis_x_label), b }, f.prototype.getLabelText = function (a) { var b = this.getLabelOptionByAxisId(a); return o(b) ? b : b ? b.text : null }, f.prototype.setLabelText = function (a, b) { var c = this.owner, d = c.config, e = this.getLabelOptionByAxisId(a); o(e) ? "y" === a ? d.axis_y_label = b : "y2" === a ? d.axis_y2_label = b : "x" === a && (d.axis_x_label = b) : e && (e.text = b) }, f.prototype.getLabelPosition = function (a, b) { var c = this.getLabelOptionByAxisId(a), d = c && "object" == typeof c && c.position ? c.position : b; return { isInner: d.indexOf("inner") >= 0, isOuter: d.indexOf("outer") >= 0, isLeft: d.indexOf("left") >= 0, isCenter: d.indexOf("center") >= 0, isRight: d.indexOf("right") >= 0, isTop: d.indexOf("top") >= 0, isMiddle: d.indexOf("middle") >= 0, isBottom: d.indexOf("bottom") >= 0 } }, f.prototype.getXAxisLabelPosition = function () { return this.getLabelPosition("x", this.owner.config.axis_rotated ? "inner-top" : "inner-right") }, f.prototype.getYAxisLabelPosition = function () { return this.getLabelPosition("y", this.owner.config.axis_rotated ? "inner-right" : "inner-top") }, f.prototype.getY2AxisLabelPosition = function () { return this.getLabelPosition("y2", this.owner.config.axis_rotated ? "inner-right" : "inner-top") }, f.prototype.getLabelPositionById = function (a) { return "y2" === a ? this.getY2AxisLabelPosition() : "y" === a ? this.getYAxisLabelPosition() : this.getXAxisLabelPosition() }, f.prototype.textForXAxisLabel = function () { return this.getLabelText("x") }, f.prototype.textForYAxisLabel = function () { return this.getLabelText("y") }, f.prototype.textForY2AxisLabel = function () { return this.getLabelText("y2") }, f.prototype.xForAxisLabel = function (a, b) { var c = this.owner; return a ? b.isLeft ? 0 : b.isCenter ? c.width / 2 : c.width : b.isBottom ? -c.height : b.isMiddle ? -c.height / 2 : 0 }, f.prototype.dxForAxisLabel = function (a, b) { return a ? b.isLeft ? "0.5em" : b.isRight ? "-0.5em" : "0" : b.isTop ? "-0.5em" : b.isBottom ? "0.5em" : "0" }, f.prototype.textAnchorForAxisLabel = function (a, b) { return a ? b.isLeft ? "start" : b.isCenter ? "middle" : "end" : b.isBottom ? "start" : b.isMiddle ? "middle" : "end" }, f.prototype.xForXAxisLabel = function () { return this.xForAxisLabel(!this.owner.config.axis_rotated, this.getXAxisLabelPosition()) }, f.prototype.xForYAxisLabel = function () { return this.xForAxisLabel(this.owner.config.axis_rotated, this.getYAxisLabelPosition()) }, f.prototype.xForY2AxisLabel = function () { return this.xForAxisLabel(this.owner.config.axis_rotated, this.getY2AxisLabelPosition()) }, f.prototype.dxForXAxisLabel = function () { return this.dxForAxisLabel(!this.owner.config.axis_rotated, this.getXAxisLabelPosition()) }, f.prototype.dxForYAxisLabel = function () { return this.dxForAxisLabel(this.owner.config.axis_rotated, this.getYAxisLabelPosition()) }, f.prototype.dxForY2AxisLabel = function () { return this.dxForAxisLabel(this.owner.config.axis_rotated, this.getY2AxisLabelPosition()) }, f.prototype.dyForXAxisLabel = function () { var a = this.owner, b = a.config, c = this.getXAxisLabelPosition(); return b.axis_rotated ? c.isInner ? "1.2em" : -25 - this.getMaxTickWidth("x") : c.isInner ? "-0.5em" : b.axis_x_height ? b.axis_x_height - 10 : "3em" }, f.prototype.dyForYAxisLabel = function () { var a = this.owner, b = this.getYAxisLabelPosition(); return a.config.axis_rotated ? b.isInner ? "-0.5em" : "3em" : b.isInner ? "1.2em" : -10 - (a.config.axis_y_inner ? 0 : this.getMaxTickWidth("y") + 10) }, f.prototype.dyForY2AxisLabel = function () { var a = this.owner, b = this.getY2AxisLabelPosition(); return a.config.axis_rotated ? b.isInner ? "1.2em" : "-2.2em" : b.isInner ? "-0.5em" : 15 + (a.config.axis_y2_inner ? 0 : this.getMaxTickWidth("y2") + 15) }, f.prototype.textAnchorForXAxisLabel = function () { var a = this.owner; return this.textAnchorForAxisLabel(!a.config.axis_rotated, this.getXAxisLabelPosition()) }, f.prototype.textAnchorForYAxisLabel = function () { var a = this.owner; return this.textAnchorForAxisLabel(a.config.axis_rotated, this.getYAxisLabelPosition()) }, f.prototype.textAnchorForY2AxisLabel = function () { var a = this.owner; return this.textAnchorForAxisLabel(a.config.axis_rotated, this.getY2AxisLabelPosition()) }, f.prototype.getMaxTickWidth = function (a, b) { var c, d, e, f, g, h = this.owner, i = h.config, j = 0; return b && h.currentMaxTickWidths[a] ? h.currentMaxTickWidths[a] : (h.svg && (c = h.filterTargetsToShow(h.data.targets), "y" === a ? (d = h.y.copy().domain(h.getYDomain(c, "y")), e = this.getYAxis(d, h.yOrient, i.axis_y_tick_format, h.yAxisTickValues, !1, !0)) : "y2" === a ? (d = h.y2.copy().domain(h.getYDomain(c, "y2")), e = this.getYAxis(d, h.y2Orient, i.axis_y2_tick_format, h.y2AxisTickValues, !1, !0)) : (d = h.x.copy().domain(h.getXDomain(c)), e = this.getXAxis(d, h.xOrient, h.xAxisTickFormat, h.xAxisTickValues, !1, !0, !0), this.updateXAxisTickValues(c, e)), f = h.d3.select("body").append("div").classed("c3", !0), g = f.append("svg").style("visibility", "hidden").style("position", "fixed").style("top", 0).style("left", 0), g.append("g").call(e).each(function () { h.d3.select(this).selectAll("text").each(function () { var a = this.getBoundingClientRect(); j < a.width && (j = a.width) }), f.remove() })), h.currentMaxTickWidths[a] = 0 >= j ? h.currentMaxTickWidths[a] : j, h.currentMaxTickWidths[a]) }, f.prototype.updateLabels = function (a) { var b = this.owner, c = b.main.select("." + l.axisX + " ." + l.axisXLabel), d = b.main.select("." + l.axisY + " ." + l.axisYLabel), e = b.main.select("." + l.axisY2 + " ." + l.axisY2Label); (a ? c.transition() : c).attr("x", this.xForXAxisLabel.bind(this)).attr("dx", this.dxForXAxisLabel.bind(this)).attr("dy", this.dyForXAxisLabel.bind(this)).text(this.textForXAxisLabel.bind(this)), (a ? d.transition() : d).attr("x", this.xForYAxisLabel.bind(this)).attr("dx", this.dxForYAxisLabel.bind(this)).attr("dy", this.dyForYAxisLabel.bind(this)).text(this.textForYAxisLabel.bind(this)), (a ? e.transition() : e).attr("x", this.xForY2AxisLabel.bind(this)).attr("dx", this.dxForY2AxisLabel.bind(this)).attr("dy", this.dyForY2AxisLabel.bind(this)).text(this.textForY2AxisLabel.bind(this)) }, f.prototype.getPadding = function (a, b, c, d) { return m(a[b]) ? "ratio" === a.unit ? a[b] * d : this.convertPixelsToAxisPadding(a[b], d) : c }, f.prototype.convertPixelsToAxisPadding = function (a, b) { var c = this.owner, d = c.config.axis_rotated ? c.width : c.height; return b * (a / d) }, f.prototype.generateTickValues = function (a, b, c) { var d, e, f, g, h, i, j, k = a; if (b) if (d = n(b) ? b() : b, 1 === d) k = [a[0]]; else if (2 === d) k = [a[0], a[a.length - 1]]; else if (d > 2) { for (g = d - 2, e = a[0], f = a[a.length - 1], h = (f - e) / (g + 1), k = [e], i = 0; g > i; i++)j = +e + h * (i + 1), k.push(c ? new Date(j) : j); k.push(f) } return c || (k = k.sort(function (a, b) { return a - b })), k }, f.prototype.generateTransitions = function (a) { var b = this.owner, c = b.axes; return { axisX: a ? c.x.transition().duration(a) : c.x, axisY: a ? c.y.transition().duration(a) : c.y, axisY2: a ? c.y2.transition().duration(a) : c.y2, axisSubX: a ? c.subx.transition().duration(a) : c.subx } }, f.prototype.redraw = function (a, b) { var c = this.owner; c.axes.x.style("opacity", b ? 0 : 1), c.axes.y.style("opacity", b ? 0 : 1), c.axes.y2.style("opacity", b ? 0 : 1), c.axes.subx.style("opacity", b ? 0 : 1), a.axisX.call(c.xAxis), a.axisY.call(c.yAxis), a.axisY2.call(c.y2Axis), a.axisSubX.call(c.subXAxis) }, i.getClipPath = function (b) { var c = a.navigator.appVersion.toLowerCase().indexOf("msie 9.") >= 0; return "url(" + (c ? "" : document.URL.split("#")[0]) + "#" + b + ")" }, i.appendClip = function (a, b) { return a.append("clipPath").attr("id", b).append("rect") }, i.getAxisClipX = function (a) { var b = Math.max(30, this.margin.left); return a ? -(1 + b) : -(b - 1) }, i.getAxisClipY = function (a) { return a ? -20 : -this.margin.top }, i.getXAxisClipX = function () { var a = this; return a.getAxisClipX(!a.config.axis_rotated) }, i.getXAxisClipY = function () { var a = this; return a.getAxisClipY(!a.config.axis_rotated) }, i.getYAxisClipX = function () { var a = this; return a.config.axis_y_inner ? -1 : a.getAxisClipX(a.config.axis_rotated) }, i.getYAxisClipY = function () { var a = this; return a.getAxisClipY(a.config.axis_rotated) }, i.getAxisClipWidth = function (a) { var b = this, c = Math.max(30, b.margin.left), d = Math.max(30, b.margin.right); return a ? b.width + 2 + c + d : b.margin.left + 20 }, i.getAxisClipHeight = function (a) { return (a ? this.margin.bottom : this.margin.top + this.height) + 20 }, i.getXAxisClipWidth = function () { var a = this; return a.getAxisClipWidth(!a.config.axis_rotated) }, i.getXAxisClipHeight = function () { var a = this; return a.getAxisClipHeight(!a.config.axis_rotated) }, i.getYAxisClipWidth = function () { var a = this; return a.getAxisClipWidth(a.config.axis_rotated) + (a.config.axis_y_inner ? 20 : 0) }, i.getYAxisClipHeight = function () { var a = this; return a.getAxisClipHeight(a.config.axis_rotated) }, i.initPie = function () { var a = this, b = a.d3, c = a.config; a.pie = b.layout.pie().value(function (a) { return a.values.reduce(function (a, b) { return a + b.value }, 0) }), c.data_order || a.pie.sort(null) }, i.updateRadius = function () { var a = this, b = a.config, c = b.gauge_width || b.donut_width; a.radiusExpanded = Math.min(a.arcWidth, a.arcHeight) / 2, a.radius = .95 * a.radiusExpanded, a.innerRadiusRatio = c ? (a.radius - c) / a.radius : .6, a.innerRadius = a.hasType("donut") || a.hasType("gauge") ? a.radius * a.innerRadiusRatio : 0 }, i.updateArc = function () { var a = this; a.svgArc = a.getSvgArc(), a.svgArcExpanded = a.getSvgArcExpanded(), a.svgArcExpandedSub = a.getSvgArcExpanded(.98) }, i.updateAngle = function (a) {
		var b, c, d = this, e = d.config, f = !1, g = 0, h = e.gauge_min, i = e.gauge_max;
		return d.pie(d.filterTargetsToShow(d.data.targets)).forEach(function (b) { f || b.data.id !== a.data.id || (f = !0, a = b, a.index = g), g++ }), isNaN(a.startAngle) && (a.startAngle = 0), isNaN(a.endAngle) && (a.endAngle = a.startAngle), d.isGaugeType(a.data) && (b = Math.PI / (i - h), c = a.value < h ? 0 : a.value < i ? a.value - h : i - h, a.startAngle = -1 * (Math.PI / 2), a.endAngle = a.startAngle + b * c), f ? a : null
	}, i.getSvgArc = function () { var a = this, b = a.d3.svg.arc().outerRadius(a.radius).innerRadius(a.innerRadius), c = function (c, d) { var e; return d ? b(c) : (e = a.updateAngle(c), e ? b(e) : "M 0 0") }; return c.centroid = b.centroid, c }, i.getSvgArcExpanded = function (a) { var b = this, c = b.d3.svg.arc().outerRadius(b.radiusExpanded * (a ? a : 1)).innerRadius(b.innerRadius); return function (a) { var d = b.updateAngle(a); return d ? c(d) : "M 0 0" } }, i.getArc = function (a, b, c) { return c || this.isArcType(a.data) ? this.svgArc(a, b) : "M 0 0" }, i.transformForArcLabel = function (a) { var b, c, d, e, f, g = this, h = g.updateAngle(a), i = ""; return h && !g.hasType("gauge") && (b = this.svgArc.centroid(h), c = isNaN(b[0]) ? 0 : b[0], d = isNaN(b[1]) ? 0 : b[1], e = Math.sqrt(c * c + d * d), f = g.radius && e ? (36 / g.radius > .375 ? 1.175 - 36 / g.radius : .8) * g.radius / e : 0, i = "translate(" + c * f + "," + d * f + ")"), i }, i.getArcRatio = function (a) { var b = this, c = b.hasType("gauge") ? Math.PI : 2 * Math.PI; return a ? (a.endAngle - a.startAngle) / c : null }, i.convertToArcData = function (a) { return this.addName({ id: a.data.id, value: a.value, ratio: this.getArcRatio(a), index: a.index }) }, i.textForArcLabel = function (a) { var b, c, d, e, f, g = this; return g.shouldShowArcLabel() ? (b = g.updateAngle(a), c = b ? b.value : null, d = g.getArcRatio(b), e = a.data.id, g.hasType("gauge") || g.meetsArcLabelThreshold(d) ? (f = g.getArcLabelFormat(), f ? f(c, d, e) : g.defaultArcValueFormat(c, d)) : "") : "" }, i.expandArc = function (b) { var c, d = this; return d.transiting ? void (c = a.setInterval(function () { d.transiting || (a.clearInterval(c), d.legend.selectAll(".c3-legend-item-focused").size() > 0 && d.expandArc(b)) }, 10)) : (b = d.mapToTargetIds(b), void d.svg.selectAll(d.selectorTargets(b, "." + l.chartArc)).each(function (a) { d.shouldExpand(a.data.id) && d.d3.select(this).selectAll("path").transition().duration(50).attr("d", d.svgArcExpanded).transition().duration(100).attr("d", d.svgArcExpandedSub).each(function (a) { d.isDonutType(a.data) }) })) }, i.unexpandArc = function (a) { var b = this; b.transiting || (a = b.mapToTargetIds(a), b.svg.selectAll(b.selectorTargets(a, "." + l.chartArc)).selectAll("path").transition().duration(50).attr("d", b.svgArc), b.svg.selectAll("." + l.arc).style("opacity", 1)) }, i.shouldExpand = function (a) { var b = this, c = b.config; return b.isDonutType(a) && c.donut_expand || b.isGaugeType(a) && c.gauge_expand || b.isPieType(a) && c.pie_expand }, i.shouldShowArcLabel = function () { var a = this, b = a.config, c = !0; return a.hasType("donut") ? c = b.donut_label_show : a.hasType("pie") && (c = b.pie_label_show), c }, i.meetsArcLabelThreshold = function (a) { var b = this, c = b.config, d = b.hasType("donut") ? c.donut_label_threshold : c.pie_label_threshold; return a >= d }, i.getArcLabelFormat = function () { var a = this, b = a.config, c = b.pie_label_format; return a.hasType("gauge") ? c = b.gauge_label_format : a.hasType("donut") && (c = b.donut_label_format), c }, i.getArcTitle = function () { var a = this; return a.hasType("donut") ? a.config.donut_title : "" }, i.updateTargetsForArc = function (a) { var b, c, d = this, e = d.main, f = d.classChartArc.bind(d), g = d.classArcs.bind(d), h = d.classFocus.bind(d); b = e.select("." + l.chartArcs).selectAll("." + l.chartArc).data(d.pie(a)).attr("class", function (a) { return f(a) + h(a.data) }), c = b.enter().append("g").attr("class", f), c.append("g").attr("class", g), c.append("text").attr("dy", d.hasType("gauge") ? "-.1em" : ".35em").style("opacity", 0).style("text-anchor", "middle").style("pointer-events", "none") }, i.initArc = function () { var a = this; a.arcs = a.main.select("." + l.chart).append("g").attr("class", l.chartArcs).attr("transform", a.getTranslate("arc")), a.arcs.append("text").attr("class", l.chartArcsTitle).style("text-anchor", "middle").text(a.getArcTitle()) }, i.redrawArc = function (a, b, c) { var d, e = this, f = e.d3, g = e.config, h = e.main; d = h.selectAll("." + l.arcs).selectAll("." + l.arc).data(e.arcData.bind(e)), d.enter().append("path").attr("class", e.classArc.bind(e)).style("fill", function (a) { return e.color(a.data) }).style("cursor", function (a) { return g.interaction_enabled && g.data_selection_isselectable(a) ? "pointer" : null }).style("opacity", 0).each(function (a) { e.isGaugeType(a.data) && (a.startAngle = a.endAngle = -1 * (Math.PI / 2)), this._current = a }), d.attr("transform", function (a) { return !e.isGaugeType(a.data) && c ? "scale(0)" : "" }).style("opacity", function (a) { return a === this._current ? 0 : 1 }).on("mouseover", g.interaction_enabled ? function (a) { var b, c; e.transiting || (b = e.updateAngle(a), c = e.convertToArcData(b), e.expandArc(b.data.id), e.api.focus(b.data.id), e.toggleFocusLegend(b.data.id, !0), e.config.data_onmouseover(c, this)) } : null).on("mousemove", g.interaction_enabled ? function (a) { var b = e.updateAngle(a), c = e.convertToArcData(b), d = [c]; e.showTooltip(d, this) } : null).on("mouseout", g.interaction_enabled ? function (a) { var b, c; e.transiting || (b = e.updateAngle(a), c = e.convertToArcData(b), e.unexpandArc(b.data.id), e.api.revert(), e.revertLegend(), e.hideTooltip(), e.config.data_onmouseout(c, this)) } : null).on("click", g.interaction_enabled ? function (a, b) { var c = e.updateAngle(a), d = e.convertToArcData(c); e.toggleShape && e.toggleShape(this, d, b), e.config.data_onclick.call(e.api, d, this) } : null).each(function () { e.transiting = !0 }).transition().duration(a).attrTween("d", function (a) { var b, c = e.updateAngle(a); return c ? (isNaN(this._current.startAngle) && (this._current.startAngle = 0), isNaN(this._current.endAngle) && (this._current.endAngle = this._current.startAngle), b = f.interpolate(this._current, c), this._current = b(0), function (c) { var d = b(c); return d.data = a.data, e.getArc(d, !0) }) : function () { return "M 0 0" } }).attr("transform", c ? "scale(1)" : "").style("fill", function (a) { return e.levelColor ? e.levelColor(a.data.values[0].value) : e.color(a.data.id) }).style("opacity", 1).call(e.endall, function () { e.transiting = !1 }), d.exit().transition().duration(b).style("opacity", 0).remove(), h.selectAll("." + l.chartArc).select("text").style("opacity", 0).attr("class", function (a) { return e.isGaugeType(a.data) ? l.gaugeValue : "" }).text(e.textForArcLabel.bind(e)).attr("transform", e.transformForArcLabel.bind(e)).style("font-size", function (a) { return e.isGaugeType(a.data) ? Math.round(e.radius / 5) + "px" : "" }).transition().duration(a).style("opacity", function (a) { return e.isTargetToShow(a.data.id) && e.isArcType(a.data) ? 1 : 0 }), h.select("." + l.chartArcsTitle).style("opacity", e.hasType("donut") || e.hasType("gauge") ? 1 : 0), e.hasType("gauge") && (e.arcs.select("." + l.chartArcsBackground).attr("d", function () { var a = { data: [{ value: g.gauge_max }], startAngle: -1 * (Math.PI / 2), endAngle: Math.PI / 2 }; return e.getArc(a, !0, !0) }), e.arcs.select("." + l.chartArcsGaugeUnit).attr("dy", ".75em").text(g.gauge_label_show ? g.gauge_units : ""), e.arcs.select("." + l.chartArcsGaugeMin).attr("dx", -1 * (e.innerRadius + (e.radius - e.innerRadius) / 2) + "px").attr("dy", "1.2em").text(g.gauge_label_show ? g.gauge_min : ""), e.arcs.select("." + l.chartArcsGaugeMax).attr("dx", e.innerRadius + (e.radius - e.innerRadius) / 2 + "px").attr("dy", "1.2em").text(g.gauge_label_show ? g.gauge_max : "")) }, i.initGauge = function () { var a = this.arcs; this.hasType("gauge") && (a.append("path").attr("class", l.chartArcsBackground), a.append("text").attr("class", l.chartArcsGaugeUnit).style("text-anchor", "middle").style("pointer-events", "none"), a.append("text").attr("class", l.chartArcsGaugeMin).style("text-anchor", "middle").style("pointer-events", "none"), a.append("text").attr("class", l.chartArcsGaugeMax).style("text-anchor", "middle").style("pointer-events", "none")) }, i.getGaugeLabelHeight = function () { return this.config.gauge_label_show ? 20 : 0 }, i.initRegion = function () { var a = this; a.region = a.main.append("g").attr("clip-path", a.clipPath).attr("class", l.regions) }, i.updateRegion = function (a) { var b = this, c = b.config; b.region.style("visibility", b.hasArcType() ? "hidden" : "visible"), b.mainRegion = b.main.select("." + l.regions).selectAll("." + l.region).data(c.regions), b.mainRegion.enter().append("g").attr("class", b.classRegion.bind(b)).append("rect").style("fill-opacity", 0), b.mainRegion.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawRegion = function (a) { var b = this, c = b.mainRegion.selectAll("rect"), d = b.regionX.bind(b), e = b.regionY.bind(b), f = b.regionWidth.bind(b), g = b.regionHeight.bind(b); return [(a ? c.transition() : c).attr("x", d).attr("y", e).attr("width", f).attr("height", g).style("fill-opacity", function (a) { return m(a.opacity) ? a.opacity : .1 })] }, i.regionX = function (a) { var b, c = this, d = c.config, e = "y" === a.axis ? c.y : c.y2; return b = "y" === a.axis || "y2" === a.axis ? d.axis_rotated && "start" in a ? e(a.start) : 0 : d.axis_rotated ? 0 : "start" in a ? c.x(c.isTimeSeries() ? c.parseDate(a.start) : a.start) : 0 }, i.regionY = function (a) { var b, c = this, d = c.config, e = "y" === a.axis ? c.y : c.y2; return b = "y" === a.axis || "y2" === a.axis ? d.axis_rotated ? 0 : "end" in a ? e(a.end) : 0 : d.axis_rotated && "start" in a ? c.x(c.isTimeSeries() ? c.parseDate(a.start) : a.start) : 0 }, i.regionWidth = function (a) { var b, c = this, d = c.config, e = c.regionX(a), f = "y" === a.axis ? c.y : c.y2; return b = "y" === a.axis || "y2" === a.axis ? d.axis_rotated && "end" in a ? f(a.end) : c.width : d.axis_rotated ? c.width : "end" in a ? c.x(c.isTimeSeries() ? c.parseDate(a.end) : a.end) : c.width, e > b ? 0 : b - e }, i.regionHeight = function (a) { var b, c = this, d = c.config, e = this.regionY(a), f = "y" === a.axis ? c.y : c.y2; return b = "y" === a.axis || "y2" === a.axis ? d.axis_rotated ? c.height : "start" in a ? f(a.start) : c.height : d.axis_rotated && "end" in a ? c.x(c.isTimeSeries() ? c.parseDate(a.end) : a.end) : c.height, e > b ? 0 : b - e }, i.isRegionOnX = function (a) { return !a.axis || "x" === a.axis }, i.drag = function (a) { var b, c, d, e, f, g, h, i, j = this, k = j.config, m = j.main, n = j.d3; j.hasArcType() || k.data_selection_enabled && (!k.zoom_enabled || j.zoom.altDomain) && k.data_selection_multiple && (b = j.dragStart[0], c = j.dragStart[1], d = a[0], e = a[1], f = Math.min(b, d), g = Math.max(b, d), h = k.data_selection_grouped ? j.margin.top : Math.min(c, e), i = k.data_selection_grouped ? j.height : Math.max(c, e), m.select("." + l.dragarea).attr("x", f).attr("y", h).attr("width", g - f).attr("height", i - h), m.selectAll("." + l.shapes).selectAll("." + l.shape).filter(function (a) { return k.data_selection_isselectable(a) }).each(function (a, b) { var c, d, e, k, m, o, p = n.select(this), q = p.classed(l.SELECTED), r = p.classed(l.INCLUDED), s = !1; if (p.classed(l.circle)) c = 1 * p.attr("cx"), d = 1 * p.attr("cy"), m = j.togglePoint, s = c > f && g > c && d > h && i > d; else { if (!p.classed(l.bar)) return; o = y(this), c = o.x, d = o.y, e = o.width, k = o.height, m = j.togglePath, s = !(c > g || f > c + e || d > i || h > d + k) } s ^ r && (p.classed(l.INCLUDED, !r), p.classed(l.SELECTED, !q), m.call(j, !q, p, a, b)) })) }, i.dragstart = function (a) { var b = this, c = b.config; b.hasArcType() || c.data_selection_enabled && (b.dragStart = a, b.main.select("." + l.chart).append("rect").attr("class", l.dragarea).style("opacity", .1), b.dragging = !0) }, i.dragend = function () { var a = this, b = a.config; a.hasArcType() || b.data_selection_enabled && (a.main.select("." + l.dragarea).transition().duration(100).style("opacity", 0).remove(), a.main.selectAll("." + l.shape).classed(l.INCLUDED, !1), a.dragging = !1) }, i.selectPoint = function (a, b, c) { var d = this, e = d.config, f = (e.axis_rotated ? d.circleY : d.circleX).bind(d), g = (e.axis_rotated ? d.circleX : d.circleY).bind(d), h = d.pointSelectR.bind(d); e.data_onselected.call(d.api, b, a.node()), d.main.select("." + l.selectedCircles + d.getTargetSelectorSuffix(b.id)).selectAll("." + l.selectedCircle + "-" + c).data([b]).enter().append("circle").attr("class", function () { return d.generateClass(l.selectedCircle, c) }).attr("cx", f).attr("cy", g).attr("stroke", function () { return d.color(b) }).attr("r", function (a) { return 1.4 * d.pointSelectR(a) }).transition().duration(100).attr("r", h) }, i.unselectPoint = function (a, b, c) { var d = this; d.config.data_onunselected(b, a.node()), d.main.select("." + l.selectedCircles + d.getTargetSelectorSuffix(b.id)).selectAll("." + l.selectedCircle + "-" + c).transition().duration(100).attr("r", 0).remove() }, i.togglePoint = function (a, b, c, d) { a ? this.selectPoint(b, c, d) : this.unselectPoint(b, c, d) }, i.selectPath = function (a, b) { var c = this; c.config.data_onselected.call(c, b, a.node()), a.transition().duration(100).style("fill", function () { return c.d3.rgb(c.color(b)).brighter(.75) }) }, i.unselectPath = function (a, b) { var c = this; c.config.data_onunselected.call(c, b, a.node()), a.transition().duration(100).style("fill", function () { return c.color(b) }) }, i.togglePath = function (a, b, c, d) { a ? this.selectPath(b, c, d) : this.unselectPath(b, c, d) }, i.getToggle = function (a, b) { var c, d = this; return "circle" === a.nodeName ? c = d.isStepType(b) ? function () { } : d.togglePoint : "path" === a.nodeName && (c = d.togglePath), c }, i.toggleShape = function (a, b, c) { var d = this, e = d.d3, f = d.config, g = e.select(a), h = g.classed(l.SELECTED), i = d.getToggle(a, b).bind(d); f.data_selection_enabled && f.data_selection_isselectable(b) && (f.data_selection_multiple || d.main.selectAll("." + l.shapes + (f.data_selection_grouped ? d.getTargetSelectorSuffix(b.id) : "")).selectAll("." + l.shape).each(function (a, b) { var c = e.select(this); c.classed(l.SELECTED) && i(!1, c.classed(l.SELECTED, !1), a, b) }), g.classed(l.SELECTED, !h), i(!h, g, b, c)) }, i.initBrush = function () { var a = this, b = a.d3; a.brush = b.svg.brush().on("brush", function () { a.redrawForBrush() }), a.brush.update = function () { return a.context && a.context.select("." + l.brush).call(this), this }, a.brush.scale = function (b) { return a.config.axis_rotated ? this.y(b) : this.x(b) } }, i.initSubchart = function () { var a = this, b = a.config, c = a.context = a.svg.append("g").attr("transform", a.getTranslate("context")); c.style("visibility", b.subchart_show ? "visible" : "hidden"), c.append("g").attr("clip-path", a.clipPathForSubchart).attr("class", l.chart), c.select("." + l.chart).append("g").attr("class", l.chartBars), c.select("." + l.chart).append("g").attr("class", l.chartLines), c.append("g").attr("clip-path", a.clipPath).attr("class", l.brush).call(a.brush), a.axes.subx = c.append("g").attr("class", l.axisX).attr("transform", a.getTranslate("subx")).attr("clip-path", b.axis_rotated ? "" : a.clipPathForXAxis) }, i.updateTargetsForSubchart = function (a) { var b, c, d, e, f = this, g = f.context, h = f.config, i = f.classChartBar.bind(f), j = f.classBars.bind(f), k = f.classChartLine.bind(f), m = f.classLines.bind(f), n = f.classAreas.bind(f); h.subchart_show && (e = g.select("." + l.chartBars).selectAll("." + l.chartBar).data(a).attr("class", i), d = e.enter().append("g").style("opacity", 0).attr("class", i), d.append("g").attr("class", j), c = g.select("." + l.chartLines).selectAll("." + l.chartLine).data(a).attr("class", k), b = c.enter().append("g").style("opacity", 0).attr("class", k), b.append("g").attr("class", m), b.append("g").attr("class", n), g.selectAll("." + l.brush + " rect").attr(h.axis_rotated ? "width" : "height", h.axis_rotated ? f.width2 : f.height2)) }, i.updateBarForSubchart = function (a) { var b = this; b.contextBar = b.context.selectAll("." + l.bars).selectAll("." + l.bar).data(b.barData.bind(b)), b.contextBar.enter().append("path").attr("class", b.classBar.bind(b)).style("stroke", "none").style("fill", b.color), b.contextBar.style("opacity", b.initialOpacity.bind(b)), b.contextBar.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawBarForSubchart = function (a, b, c) { (b ? this.contextBar.transition().duration(c) : this.contextBar).attr("d", a).style("opacity", 1) }, i.updateLineForSubchart = function (a) { var b = this; b.contextLine = b.context.selectAll("." + l.lines).selectAll("." + l.line).data(b.lineData.bind(b)), b.contextLine.enter().append("path").attr("class", b.classLine.bind(b)).style("stroke", b.color), b.contextLine.style("opacity", b.initialOpacity.bind(b)), b.contextLine.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawLineForSubchart = function (a, b, c) { (b ? this.contextLine.transition().duration(c) : this.contextLine).attr("d", a).style("opacity", 1) }, i.updateAreaForSubchart = function (a) { var b = this, c = b.d3; b.contextArea = b.context.selectAll("." + l.areas).selectAll("." + l.area).data(b.lineData.bind(b)), b.contextArea.enter().append("path").attr("class", b.classArea.bind(b)).style("fill", b.color).style("opacity", function () { return b.orgAreaOpacity = +c.select(this).style("opacity"), 0 }), b.contextArea.style("opacity", 0), b.contextArea.exit().transition().duration(a).style("opacity", 0).remove() }, i.redrawAreaForSubchart = function (a, b, c) { (b ? this.contextArea.transition().duration(c) : this.contextArea).attr("d", a).style("fill", this.color).style("opacity", this.orgAreaOpacity) }, i.redrawSubchart = function (a, b, c, d, e, f, g) { var h, i, j, k = this, l = k.d3, m = k.config; k.context.style("visibility", m.subchart_show ? "visible" : "hidden"), m.subchart_show && (l.event && "zoom" === l.event.type && k.brush.extent(k.x.orgDomain()).update(), a && (k.brush.empty() || k.brush.extent(k.x.orgDomain()).update(), h = k.generateDrawArea(e, !0), i = k.generateDrawBar(f, !0), j = k.generateDrawLine(g, !0), k.updateBarForSubchart(c), k.updateLineForSubchart(c), k.updateAreaForSubchart(c), k.redrawBarForSubchart(i, c, c), k.redrawLineForSubchart(j, c, c), k.redrawAreaForSubchart(h, c, c))) }, i.redrawForBrush = function () { var a = this, b = a.x; a.redraw({ withTransition: !1, withY: a.config.zoom_rescale, withSubchart: !1, withUpdateXDomain: !0, withDimension: !1 }), a.config.subchart_onbrush.call(a.api, b.orgDomain()) }, i.transformContext = function (a, b) { var c, d = this; b && b.axisSubX ? c = b.axisSubX : (c = d.context.select("." + l.axisX), a && (c = c.transition())), d.context.attr("transform", d.getTranslate("context")), c.attr("transform", d.getTranslate("subx")) }, i.getDefaultExtent = function () { var a = this, b = a.config, c = n(b.axis_x_extent) ? b.axis_x_extent(a.getXDomain(a.data.targets)) : b.axis_x_extent; return a.isTimeSeries() && (c = [a.parseDate(c[0]), a.parseDate(c[1])]), c }, i.initZoom = function () { var a, b = this, c = b.d3, d = b.config; b.zoom = c.behavior.zoom().on("zoomstart", function () { a = c.event.sourceEvent, b.zoom.altDomain = c.event.sourceEvent.altKey ? b.x.orgDomain() : null, d.zoom_onzoomstart.call(b.api, c.event.sourceEvent) }).on("zoom", function () { b.redrawForZoom.call(b) }).on("zoomend", function () { var e = c.event.sourceEvent; e && a.clientX === e.clientX && a.clientY === e.clientY || (b.redrawEventRect(), b.updateZoom(), d.zoom_onzoomend.call(b.api, b.x.orgDomain())) }), b.zoom.scale = function (a) { return d.axis_rotated ? this.y(a) : this.x(a) }, b.zoom.orgScaleExtent = function () { var a = d.zoom_extent ? d.zoom_extent : [1, 10]; return [a[0], Math.max(b.getMaxDataCount() / a[1], a[1])] }, b.zoom.updateScaleExtent = function () { var a = t(b.x.orgDomain()) / t(b.orgXDomain), c = this.orgScaleExtent(); return this.scaleExtent([c[0] * a, c[1] * a]), this } }, i.updateZoom = function () { var a = this, b = a.config.zoom_enabled ? a.zoom : function () { }; a.main.select("." + l.zoomRect).call(b).on("dblclick.zoom", null), a.main.selectAll("." + l.eventRect).call(b).on("dblclick.zoom", null) }, i.redrawForZoom = function () { var a = this, b = a.d3, c = a.config, d = a.zoom, e = a.x; if (c.zoom_enabled && 0 !== a.filterTargetsToShow(a.data.targets).length) { if ("mousemove" === b.event.sourceEvent.type && d.altDomain) return e.domain(d.altDomain), void d.scale(e).updateScaleExtent(); a.isCategorized() && e.orgDomain()[0] === a.orgXDomain[0] && e.domain([a.orgXDomain[0] - 1e-10, e.orgDomain()[1]]), a.redraw({ withTransition: !1, withY: c.zoom_rescale, withSubchart: !1, withEventRect: !1, withDimension: !1 }), "mousemove" === b.event.sourceEvent.type && (a.cancelClick = !0), c.zoom_onzoom.call(a.api, e.orgDomain()) } }, i.generateColor = function () { var a = this, b = a.config, c = a.d3, d = b.data_colors, e = v(b.color_pattern) ? b.color_pattern : c.scale.category10().range(), f = b.data_color, g = []; return function (a) { var b, c = a.id || a.data && a.data.id || a; return d[c] instanceof Function ? b = d[c](a) : d[c] ? b = d[c] : (g.indexOf(c) < 0 && g.push(c), b = e[g.indexOf(c) % e.length], d[c] = b), f instanceof Function ? f(b, a) : b } }, i.generateLevelColor = function () { var a = this, b = a.config, c = b.color_pattern, d = b.color_threshold, e = "value" === d.unit, f = d.values && d.values.length ? d.values : [], g = d.max || 100; return v(b.color_threshold) ? function (a) { var b, d, h = c[c.length - 1]; for (b = 0; b < f.length; b++)if (d = e ? a : 100 * a / g, d < f[b]) { h = c[b]; break } return h } : null }, i.getYFormat = function (a) { var b = this, c = a && !b.hasType("gauge") ? b.defaultArcValueFormat : b.yFormat, d = a && !b.hasType("gauge") ? b.defaultArcValueFormat : b.y2Format; return function (a, e, f) { var g = "y2" === b.axis.getId(f) ? d : c; return g.call(b, a, e) } }, i.yFormat = function (a) { var b = this, c = b.config, d = c.axis_y_tick_format ? c.axis_y_tick_format : b.defaultValueFormat; return d(a) }, i.y2Format = function (a) { var b = this, c = b.config, d = c.axis_y2_tick_format ? c.axis_y2_tick_format : b.defaultValueFormat; return d(a) }, i.defaultValueFormat = function (a) { return m(a) ? +a : "" }, i.defaultArcValueFormat = function (a, b) { return (100 * b).toFixed(1) + "%" }, i.dataLabelFormat = function (a) { var b, c = this, d = c.config.data_labels, e = function (a) { return m(a) ? +a : "" }; return b = "function" == typeof d.format ? d.format : "object" == typeof d.format ? d.format[a] ? d.format[a] === !0 ? e : d.format[a] : function () { return "" } : e }, i.hasCaches = function (a) { for (var b = 0; b < a.length; b++)if (!(a[b] in this.cache)) return !1; return !0 }, i.addCache = function (a, b) { this.cache[a] = this.cloneTarget(b) }, i.getCaches = function (a) { var b, c = []; for (b = 0; b < a.length; b++)a[b] in this.cache && c.push(this.cloneTarget(this.cache[a[b]])); return c }; var l = i.CLASS = { target: "c3-target", chart: "c3-chart", chartLine: "c3-chart-line", chartLines: "c3-chart-lines", chartBar: "c3-chart-bar", chartBars: "c3-chart-bars", chartText: "c3-chart-text", chartTexts: "c3-chart-texts", chartArc: "c3-chart-arc", chartArcs: "c3-chart-arcs", chartArcsTitle: "c3-chart-arcs-title", chartArcsBackground: "c3-chart-arcs-background", chartArcsGaugeUnit: "c3-chart-arcs-gauge-unit", chartArcsGaugeMax: "c3-chart-arcs-gauge-max", chartArcsGaugeMin: "c3-chart-arcs-gauge-min", selectedCircle: "c3-selected-circle", selectedCircles: "c3-selected-circles", eventRect: "c3-event-rect", eventRects: "c3-event-rects", eventRectsSingle: "c3-event-rects-single", eventRectsMultiple: "c3-event-rects-multiple", zoomRect: "c3-zoom-rect", brush: "c3-brush", focused: "c3-focused", defocused: "c3-defocused", region: "c3-region", regions: "c3-regions", tooltipContainer: "c3-tooltip-container", tooltip: "c3-tooltip", tooltipName: "c3-tooltip-name", shape: "c3-shape", shapes: "c3-shapes", line: "c3-line", lines: "c3-lines", bar: "c3-bar", bars: "c3-bars", circle: "c3-circle", circles: "c3-circles", arc: "c3-arc", arcs: "c3-arcs", area: "c3-area", areas: "c3-areas", empty: "c3-empty", text: "c3-text", texts: "c3-texts", gaugeValue: "c3-gauge-value", grid: "c3-grid", gridLines: "c3-grid-lines", xgrid: "c3-xgrid", xgrids: "c3-xgrids", xgridLine: "c3-xgrid-line", xgridLines: "c3-xgrid-lines", xgridFocus: "c3-xgrid-focus", ygrid: "c3-ygrid", ygrids: "c3-ygrids", ygridLine: "c3-ygrid-line", ygridLines: "c3-ygrid-lines", axis: "c3-axis", axisX: "c3-axis-x", axisXLabel: "c3-axis-x-label", axisY: "c3-axis-y", axisYLabel: "c3-axis-y-label", axisY2: "c3-axis-y2", axisY2Label: "c3-axis-y2-label", legendBackground: "c3-legend-background", legendItem: "c3-legend-item", legendItemEvent: "c3-legend-item-event", legendItemTile: "c3-legend-item-tile", legendItemHidden: "c3-legend-item-hidden", legendItemFocused: "c3-legend-item-focused", dragarea: "c3-dragarea", EXPANDED: "_expanded_", SELECTED: "_selected_", INCLUDED: "_included_" }; i.generateClass = function (a, b) { return " " + a + " " + a + this.getTargetSelectorSuffix(b) }, i.classText = function (a) { return this.generateClass(l.text, a.index) }, i.classTexts = function (a) { return this.generateClass(l.texts, a.id) }, i.classShape = function (a) { return this.generateClass(l.shape, a.index) }, i.classShapes = function (a) { return this.generateClass(l.shapes, a.id) }, i.classLine = function (a) { return this.classShape(a) + this.generateClass(l.line, a.id) }, i.classLines = function (a) { return this.classShapes(a) + this.generateClass(l.lines, a.id) }, i.classCircle = function (a) { return this.classShape(a) + this.generateClass(l.circle, a.index) }, i.classCircles = function (a) { return this.classShapes(a) + this.generateClass(l.circles, a.id) }, i.classBar = function (a) { return this.classShape(a) + this.generateClass(l.bar, a.index) }, i.classBars = function (a) { return this.classShapes(a) + this.generateClass(l.bars, a.id) }, i.classArc = function (a) { return this.classShape(a.data) + this.generateClass(l.arc, a.data.id) }, i.classArcs = function (a) { return this.classShapes(a.data) + this.generateClass(l.arcs, a.data.id) }, i.classArea = function (a) { return this.classShape(a) + this.generateClass(l.area, a.id) }, i.classAreas = function (a) { return this.classShapes(a) + this.generateClass(l.areas, a.id) }, i.classRegion = function (a, b) { return this.generateClass(l.region, b) + " " + ("class" in a ? a["class"] : "") }, i.classEvent = function (a) { return this.generateClass(l.eventRect, a.index) }, i.classTarget = function (a) { var b = this, c = b.config.data_classes[a], d = ""; return c && (d = " " + l.target + "-" + c), b.generateClass(l.target, a) + d }, i.classFocus = function (a) { return this.classFocused(a) + this.classDefocused(a) }, i.classFocused = function (a) { return " " + (this.focusedTargetIds.indexOf(a.id) >= 0 ? l.focused : "") }, i.classDefocused = function (a) { return " " + (this.defocusedTargetIds.indexOf(a.id) >= 0 ? l.defocused : "") }, i.classChartText = function (a) { return l.chartText + this.classTarget(a.id) }, i.classChartLine = function (a) { return l.chartLine + this.classTarget(a.id) }, i.classChartBar = function (a) { return l.chartBar + this.classTarget(a.id) }, i.classChartArc = function (a) { return l.chartArc + this.classTarget(a.data.id) }, i.getTargetSelectorSuffix = function (a) { return a || 0 === a ? ("-" + a).replace(/[\s?!@#$%^&*()_=+,.<>'":;\[\]\/|~`{}\\]/g, "-") : "" }, i.selectorTarget = function (a, b) { return (b || "") + "." + l.target + this.getTargetSelectorSuffix(a) }, i.selectorTargets = function (a, b) { var c = this; return a = a || [], a.length ? a.map(function (a) { return c.selectorTarget(a, b) }) : null }, i.selectorLegend = function (a) { return "." + l.legendItem + this.getTargetSelectorSuffix(a) }, i.selectorLegends = function (a) { var b = this; return a && a.length ? a.map(function (a) { return b.selectorLegend(a) }) : null }; var m = i.isValue = function (a) { return a || 0 === a }, n = i.isFunction = function (a) { return "function" == typeof a }, o = i.isString = function (a) { return "string" == typeof a }, p = i.isUndefined = function (a) { return "undefined" == typeof a }, q = i.isDefined = function (a) { return "undefined" != typeof a }, r = i.ceil10 = function (a) { return 10 * Math.ceil(a / 10) }, s = i.asHalfPixel = function (a) { return Math.ceil(a) + .5 }, t = i.diffDomain = function (a) { return a[1] - a[0] }, u = i.isEmpty = function (a) { return !a || o(a) && 0 === a.length || "object" == typeof a && 0 === Object.keys(a).length }, v = i.notEmpty = function (a) { return Object.keys(a).length > 0 }, w = i.getOption = function (a, b, c) { return q(a[b]) ? a[b] : c }, x = i.hasValue = function (a, b) { var c = !1; return Object.keys(a).forEach(function (d) { a[d] === b && (c = !0) }), c }, y = i.getPathBox = function (a) { var b = a.getBoundingClientRect(), c = [a.pathSegList.getItem(0), a.pathSegList.getItem(1)], d = c[0].x, e = Math.min(c[0].y, c[1].y); return { x: d, y: e, width: b.width, height: b.height } }; h.focus = function (a) { var b, c = this.internal; a = c.mapToTargetIds(a), b = c.svg.selectAll(c.selectorTargets(a.filter(c.isTargetToShow, c))), this.revert(), this.defocus(), b.classed(l.focused, !0).classed(l.defocused, !1), c.hasArcType() && c.expandArc(a), c.toggleFocusLegend(a, !0), c.focusedTargetIds = a, c.defocusedTargetIds = c.defocusedTargetIds.filter(function (b) { return a.indexOf(b) < 0 }) }, h.defocus = function (a) { var b, c = this.internal; a = c.mapToTargetIds(a), b = c.svg.selectAll(c.selectorTargets(a.filter(c.isTargetToShow, c))), b.classed(l.focused, !1).classed(l.defocused, !0), c.hasArcType() && c.unexpandArc(a), c.toggleFocusLegend(a, !1), c.focusedTargetIds = c.focusedTargetIds.filter(function (b) { return a.indexOf(b) < 0 }), c.defocusedTargetIds = a }, h.revert = function (a) { var b, c = this.internal; a = c.mapToTargetIds(a), b = c.svg.selectAll(c.selectorTargets(a)), b.classed(l.focused, !1).classed(l.defocused, !1), c.hasArcType() && c.unexpandArc(a), c.config.legend_show && (c.showLegend(a.filter(c.isLegendToShow.bind(c))), c.legend.selectAll(c.selectorLegends(a)).filter(function () { return c.d3.select(this).classed(l.legendItemFocused) }).classed(l.legendItemFocused, !1)), c.focusedTargetIds = [], c.defocusedTargetIds = [] }, h.show = function (a, b) { var c, d = this.internal; a = d.mapToTargetIds(a), b = b || {}, d.removeHiddenTargetIds(a), c = d.svg.selectAll(d.selectorTargets(a)), c.transition().style("opacity", 1, "important").call(d.endall, function () { c.style("opacity", null).style("opacity", 1) }), b.withLegend && d.showLegend(a), d.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0, withLegend: !0 }) }, h.hide = function (a, b) { var c, d = this.internal; a = d.mapToTargetIds(a), b = b || {}, d.addHiddenTargetIds(a), c = d.svg.selectAll(d.selectorTargets(a)), c.transition().style("opacity", 0, "important").call(d.endall, function () { c.style("opacity", null).style("opacity", 0) }), b.withLegend && d.hideLegend(a), d.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0, withLegend: !0 }) }, h.toggle = function (a, b) { var c = this, d = this.internal; d.mapToTargetIds(a).forEach(function (a) { d.isTargetToShow(a) ? c.hide(a, b) : c.show(a, b) }) }, h.zoom = function (a) { var b = this.internal; return a && (b.isTimeSeries() && (a = a.map(function (a) { return b.parseDate(a) })), b.brush.extent(a), b.redraw({ withUpdateXDomain: !0, withY: b.config.zoom_rescale }), b.config.zoom_onzoom.call(this, b.x.orgDomain())), b.brush.extent() }, h.zoom.enable = function (a) { var b = this.internal; b.config.zoom_enabled = a, b.updateAndRedraw() }, h.unzoom = function () { var a = this.internal; a.brush.clear().update(), a.redraw({ withUpdateXDomain: !0 }) }, h.load = function (a) { var b = this.internal, c = b.config; return a.xs && b.addXs(a.xs), "classes" in a && Object.keys(a.classes).forEach(function (b) { c.data_classes[b] = a.classes[b] }), "categories" in a && b.isCategorized() && (c.axis_x_categories = a.categories), "axes" in a && Object.keys(a.axes).forEach(function (b) { c.data_axes[b] = a.axes[b] }), "colors" in a && Object.keys(a.colors).forEach(function (b) { c.data_colors[b] = a.colors[b] }), "cacheIds" in a && b.hasCaches(a.cacheIds) ? void b.load(b.getCaches(a.cacheIds), a.done) : void ("unload" in a ? b.unload(b.mapToTargetIds("boolean" == typeof a.unload && a.unload ? null : a.unload), function () { b.loadFromArgs(a) }) : b.loadFromArgs(a)) }, h.unload = function (a) { var b = this.internal; a = a || {}, a instanceof Array ? a = { ids: a } : "string" == typeof a && (a = { ids: [a] }), b.unload(b.mapToTargetIds(a.ids), function () { b.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0, withLegend: !0 }), a.done && a.done() }) }, h.flow = function (a) { var b, c, d, e, f, g, h, i, j = this.internal, k = [], l = j.getMaxDataCount(), n = 0, o = 0; if (a.json) c = j.convertJsonToData(a.json, a.keys); else if (a.rows) c = j.convertRowsToData(a.rows); else { if (!a.columns) return; c = j.convertColumnsToData(a.columns) } b = j.convertDataToTargets(c, !0), j.data.targets.forEach(function (a) { var c, d, e = !1; for (c = 0; c < b.length; c++)if (a.id === b[c].id) { for (e = !0, a.values[a.values.length - 1] && (o = a.values[a.values.length - 1].index + 1), n = b[c].values.length, d = 0; n > d; d++)b[c].values[d].index = o + d, j.isTimeSeries() || (b[c].values[d].x = o + d); a.values = a.values.concat(b[c].values), b.splice(c, 1); break } e || k.push(a.id) }), j.data.targets.forEach(function (a) { var b, c; for (b = 0; b < k.length; b++)if (a.id === k[b]) for (o = a.values[a.values.length - 1].index + 1, c = 0; n > c; c++)a.values.push({ id: a.id, index: o + c, x: j.isTimeSeries() ? j.getOtherTargetX(o + c) : o + c, value: null }) }), j.data.targets.length && b.forEach(function (a) { var b, c = []; for (b = j.data.targets[0].values[0].index; o > b; b++)c.push({ id: a.id, index: b, x: j.isTimeSeries() ? j.getOtherTargetX(b) : b, value: null }); a.values.forEach(function (a) { a.index += o, j.isTimeSeries() || (a.x += o) }), a.values = c.concat(a.values) }), j.data.targets = j.data.targets.concat(b), d = j.getMaxDataCount(), f = j.data.targets[0], g = f.values[0], q(a.to) ? (n = 0, i = j.isTimeSeries() ? j.parseDate(a.to) : a.to, f.values.forEach(function (a) { a.x < i && n++ })) : q(a.length) && (n = a.length), l ? 1 === l && j.isTimeSeries() && (h = (f.values[f.values.length - 1].x - g.x) / 2, e = [new Date(+g.x - h), new Date(+g.x + h)], j.updateXDomain(null, !0, !0, !1, e)) : (h = j.isTimeSeries() ? f.values.length > 1 ? f.values[f.values.length - 1].x - g.x : g.x - j.getXDomain(j.data.targets)[0] : 1, e = [g.x - h, g.x], j.updateXDomain(null, !0, !0, !1, e)), j.updateTargets(j.data.targets), j.redraw({ flow: { index: g.index, length: n, duration: m(a.duration) ? a.duration : j.config.transition_duration, done: a.done, orgDataCount: l }, withLegend: !0, withTransition: l > 1, withTrimXDomain: !1, withUpdateXAxis: !0 }) }, i.generateFlow = function (a) {
		var b = this, c = b.config, d = b.d3; return function () {
			var e, f, g, h = a.targets, i = a.flow, j = a.drawBar, k = a.drawLine, m = a.drawArea, n = a.cx, o = a.cy, p = a.xv, q = a.xForText, r = a.yForText, s = a.duration, u = 1, v = i.index, w = i.length, x = b.getValueOnIndex(b.data.targets[0].values, v), y = b.getValueOnIndex(b.data.targets[0].values, v + w), z = b.x.domain(), A = i.duration || s, B = i.done || function () { }, C = b.generateWait(), D = b.xgrid || d.selectAll([]), E = b.xgridLines || d.selectAll([]), F = b.mainRegion || d.selectAll([]), G = b.mainText || d.selectAll([]), H = b.mainBar || d.selectAll([]), I = b.mainLine || d.selectAll([]), J = b.mainArea || d.selectAll([]), K = b.mainCircle || d.selectAll([]); b.flowing = !0, b.data.targets.forEach(function (a) { a.values.splice(0, w) }), g = b.updateXDomain(h, !0, !0), b.updateXGrid && b.updateXGrid(!0), i.orgDataCount ? e = 1 === i.orgDataCount || x.x === y.x ? b.x(z[0]) - b.x(g[0]) : b.isTimeSeries() ? b.x(z[0]) - b.x(g[0]) : b.x(x.x) - b.x(y.x) : 1 !== b.data.targets[0].values.length ? e = b.x(z[0]) - b.x(g[0]) : b.isTimeSeries() ? (x = b.getValueOnIndex(b.data.targets[0].values, 0), y = b.getValueOnIndex(b.data.targets[0].values, b.data.targets[0].values.length - 1), e = b.x(x.x) - b.x(y.x)) : e = t(g) / 2, u = t(z) / t(g), f = "translate(" + e + ",0) scale(" + u + ",1)", b.hideXGridFocus(), b.hideTooltip(), d.transition().ease("linear").duration(A).each(function () {
				C.add(b.axes.x.transition().call(b.xAxis)), C.add(H.transition().attr("transform", f)), C.add(I.transition().attr("transform", f)), C.add(J.transition().attr("transform", f)), C.add(K.transition().attr("transform", f)), C.add(G.transition().attr("transform", f)), C.add(F.filter(b.isRegionOnX).transition().attr("transform", f)), C.add(D.transition().attr("transform", f)), C.add(E.transition().attr("transform", f))
			}).call(C, function () { var a, d = [], e = [], f = []; if (w) { for (a = 0; w > a; a++)d.push("." + l.shape + "-" + (v + a)), e.push("." + l.text + "-" + (v + a)), f.push("." + l.eventRect + "-" + (v + a)); b.svg.selectAll("." + l.shapes).selectAll(d).remove(), b.svg.selectAll("." + l.texts).selectAll(e).remove(), b.svg.selectAll("." + l.eventRects).selectAll(f).remove(), b.svg.select("." + l.xgrid).remove() } D.attr("transform", null).attr(b.xgridAttr), E.attr("transform", null), E.select("line").attr("x1", c.axis_rotated ? 0 : p).attr("x2", c.axis_rotated ? b.width : p), E.select("text").attr("x", c.axis_rotated ? b.width : 0).attr("y", p), H.attr("transform", null).attr("d", j), I.attr("transform", null).attr("d", k), J.attr("transform", null).attr("d", m), K.attr("transform", null).attr("cx", n).attr("cy", o), G.attr("transform", null).attr("x", q).attr("y", r).style("fill-opacity", b.opacityForText.bind(b)), F.attr("transform", null), F.select("rect").filter(b.isRegionOnX).attr("x", b.regionX.bind(b)).attr("width", b.regionWidth.bind(b)), c.interaction_enabled && b.redrawEventRect(), B(), b.flowing = !1 })
		}
	}, h.selected = function (a) { var b = this.internal, c = b.d3; return c.merge(b.main.selectAll("." + l.shapes + b.getTargetSelectorSuffix(a)).selectAll("." + l.shape).filter(function () { return c.select(this).classed(l.SELECTED) }).map(function (a) { return a.map(function (a) { var b = a.__data__; return b.data ? b.data : b }) })) }, h.select = function (a, b, c) { var d = this.internal, e = d.d3, f = d.config; f.data_selection_enabled && d.main.selectAll("." + l.shapes).selectAll("." + l.shape).each(function (g, h) { var i = e.select(this), j = g.data ? g.data.id : g.id, k = d.getToggle(this, g).bind(d), m = f.data_selection_grouped || !a || a.indexOf(j) >= 0, n = !b || b.indexOf(h) >= 0, o = i.classed(l.SELECTED); i.classed(l.line) || i.classed(l.area) || (m && n ? f.data_selection_isselectable(g) && !o && k(!0, i.classed(l.SELECTED, !0), g, h) : q(c) && c && o && k(!1, i.classed(l.SELECTED, !1), g, h)) }) }, h.unselect = function (a, b) { var c = this.internal, d = c.d3, e = c.config; e.data_selection_enabled && c.main.selectAll("." + l.shapes).selectAll("." + l.shape).each(function (f, g) { var h = d.select(this), i = f.data ? f.data.id : f.id, j = c.getToggle(this, f).bind(c), k = e.data_selection_grouped || !a || a.indexOf(i) >= 0, m = !b || b.indexOf(g) >= 0, n = h.classed(l.SELECTED); h.classed(l.line) || h.classed(l.area) || k && m && e.data_selection_isselectable(f) && n && j(!1, h.classed(l.SELECTED, !1), f, g) }) }, h.transform = function (a, b) { var c = this.internal, d = ["pie", "donut"].indexOf(a) >= 0 ? { withTransform: !0 } : null; c.transformTo(b, a, d) }, i.transformTo = function (a, b, c) { var d = this, e = !d.hasArcType(), f = c || { withTransitionForAxis: e }; f.withTransitionForTransform = !1, d.transiting = !1, d.setTargetType(a, b), d.updateTargets(d.data.targets), d.updateAndRedraw(f) }, h.groups = function (a) { var b = this.internal, c = b.config; return p(a) ? c.data_groups : (c.data_groups = a, b.redraw(), c.data_groups) }, h.xgrids = function (a) { var b = this.internal, c = b.config; return a ? (c.grid_x_lines = a, b.redrawWithoutRescale(), c.grid_x_lines) : c.grid_x_lines }, h.xgrids.add = function (a) { var b = this.internal; return this.xgrids(b.config.grid_x_lines.concat(a ? a : [])) }, h.xgrids.remove = function (a) { var b = this.internal; b.removeGridLines(a, !0) }, h.ygrids = function (a) { var b = this.internal, c = b.config; return a ? (c.grid_y_lines = a, b.redrawWithoutRescale(), c.grid_y_lines) : c.grid_y_lines }, h.ygrids.add = function (a) { var b = this.internal; return this.ygrids(b.config.grid_y_lines.concat(a ? a : [])) }, h.ygrids.remove = function (a) { var b = this.internal; b.removeGridLines(a, !1) }, h.regions = function (a) { var b = this.internal, c = b.config; return a ? (c.regions = a, b.redrawWithoutRescale(), c.regions) : c.regions }, h.regions.add = function (a) { var b = this.internal, c = b.config; return a ? (c.regions = c.regions.concat(a), b.redrawWithoutRescale(), c.regions) : c.regions }, h.regions.remove = function (a) { var b, c, d, e = this.internal, f = e.config; return a = a || {}, b = e.getOption(a, "duration", f.transition_duration), c = e.getOption(a, "classes", [l.region]), d = e.main.select("." + l.regions).selectAll(c.map(function (a) { return "." + a })), (b ? d.transition().duration(b) : d).style("opacity", 0).remove(), f.regions = f.regions.filter(function (a) { var b = !1; return a["class"] ? (a["class"].split(" ").forEach(function (a) { c.indexOf(a) >= 0 && (b = !0) }), !b) : !0 }), f.regions }, h.data = function (a) { var b = this.internal.data.targets; return "undefined" == typeof a ? b : b.filter(function (b) { return [].concat(a).indexOf(b.id) >= 0 }) }, h.data.shown = function (a) { return this.internal.filterTargetsToShow(this.data(a)) }, h.data.values = function (a) { var b, c = null; return a && (b = this.data(a), c = b[0] ? b[0].values.map(function (a) { return a.value }) : null), c }, h.data.names = function (a) { return this.internal.clearLegendItemTextBoxCache(), this.internal.updateDataAttributes("names", a) }, h.data.colors = function (a) { return this.internal.updateDataAttributes("colors", a) }, h.data.axes = function (a) { return this.internal.updateDataAttributes("axes", a) }, h.category = function (a, b) { var c = this.internal, d = c.config; return arguments.length > 1 && (d.axis_x_categories[a] = b, c.redraw()), d.axis_x_categories[a] }, h.categories = function (a) { var b = this.internal, c = b.config; return arguments.length ? (c.axis_x_categories = a, b.redraw(), c.axis_x_categories) : c.axis_x_categories }, h.color = function (a) { var b = this.internal; return b.color(a) }, h.x = function (a) { var b = this.internal; return arguments.length && (b.updateTargetX(b.data.targets, a), b.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0 })), b.data.xs }, h.xs = function (a) { var b = this.internal; return arguments.length && (b.updateTargetXs(b.data.targets, a), b.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0 })), b.data.xs }, h.axis = function () { }, h.axis.labels = function (a) { var b = this.internal; arguments.length && (Object.keys(a).forEach(function (c) { b.axis.setLabelText(c, a[c]) }), b.axis.updateLabels()) }, h.axis.max = function (a) { var b = this.internal, c = b.config; return arguments.length ? ("object" == typeof a ? (m(a.x) && (c.axis_x_max = a.x), m(a.y) && (c.axis_y_max = a.y), m(a.y2) && (c.axis_y2_max = a.y2)) : c.axis_y_max = c.axis_y2_max = a, void b.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0 })) : { x: c.axis_x_max, y: c.axis_y_max, y2: c.axis_y2_max } }, h.axis.min = function (a) { var b = this.internal, c = b.config; return arguments.length ? ("object" == typeof a ? (m(a.x) && (c.axis_x_min = a.x), m(a.y) && (c.axis_y_min = a.y), m(a.y2) && (c.axis_y2_min = a.y2)) : c.axis_y_min = c.axis_y2_min = a, void b.redraw({ withUpdateOrgXDomain: !0, withUpdateXDomain: !0 })) : { x: c.axis_x_min, y: c.axis_y_min, y2: c.axis_y2_min } }, h.axis.range = function (a) { return arguments.length ? (q(a.max) && this.axis.max(a.max), void (q(a.min) && this.axis.min(a.min))) : { max: this.axis.max(), min: this.axis.min() } }, h.legend = function () { }, h.legend.show = function (a) { var b = this.internal; b.showLegend(b.mapToTargetIds(a)), b.updateAndRedraw({ withLegend: !0 }) }, h.legend.hide = function (a) { var b = this.internal; b.hideLegend(b.mapToTargetIds(a)), b.updateAndRedraw({ withLegend: !0 }) }, h.resize = function (a) { var b = this.internal, c = b.config; c.size_width = a ? a.width : null, c.size_height = a ? a.height : null, this.flush() }, h.flush = function () { var a = this.internal; a.updateAndRedraw({ withLegend: !0, withTransition: !1, withTransitionForTransform: !1 }) }, h.destroy = function () { var b = this.internal; return a.clearInterval(b.intervalForObserveInserted), a.onresize = null, b.selectChart.classed("c3", !1).html(""), Object.keys(b).forEach(function (a) { b[a] = null }), null }, h.tooltip = function () { }, h.tooltip.show = function (a) { var b, c, d = this.internal; a.mouse && (c = a.mouse), a.data ? d.isMultipleX() ? (c = [d.x(a.data.x), d.getYScale(a.data.id)(a.data.value)], b = null) : b = m(a.data.index) ? a.data.index : d.getIndexByX(a.data.x) : "undefined" != typeof a.x ? b = d.getIndexByX(a.x) : "undefined" != typeof a.index && (b = a.index), d.dispatchEvent("mouseover", b, c), d.dispatchEvent("mousemove", b, c) }, h.tooltip.hide = function () { this.internal.dispatchEvent("mouseout", 0) }; var z; i.isSafari = function () { var b = a.navigator.userAgent; return b.indexOf("Safari") >= 0 && b.indexOf("Chrome") < 0 }, i.isChrome = function () { var b = a.navigator.userAgent; return b.indexOf("Chrome") >= 0 }, Function.prototype.bind || (Function.prototype.bind = function (a) { if ("function" != typeof this) throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable"); var b = Array.prototype.slice.call(arguments, 1), c = this, d = function () { }, e = function () { return c.apply(this instanceof d ? this : a, b.concat(Array.prototype.slice.call(arguments))) }; return d.prototype = this.prototype, e.prototype = new d, e }), "function" == typeof define && define.amd ? define("c3", ["d3"], k) : "undefined" != typeof exports && "undefined" != typeof module ? module.exports = k : a.c3 = k
}(window);
'use strict';

angular.module('angular.css.injector', [])
	.provider('cssInjector', ['$interpolateProvider', function ($interpolateProvider) {
		var singlePageMode = false;

		function CssInjector($compile, $rootScope, $rootElement) {
			// Variables
			var head = angular.element(document.getElementsByTagName('head')[0]),
				scope;

			// Capture the event `locationChangeStart` when the url change. If singlePageMode===TRUE, call the function `removeAll`
			$rootScope.$on('$locationChangeStart', function () {
				if (singlePageMode === true)
					removeAll();
			});

			// Always called by the functions `addStylesheet` and `removeAll` to initialize the variable `scope`
			var _initScope = function () {
				if (scope === undefined) {
					scope = $rootElement.scope();
				}
			};

			// Used to add a CSS files in the head tag of the page
			var addStylesheet = function (href) {
				_initScope();

				if (scope.injectedStylesheets === undefined) {
					scope.injectedStylesheets = [];
					head.append($compile("<link data-ng-repeat='stylesheet in injectedStylesheets' data-ng-href='" + $interpolateProvider.startSymbol() + "stylesheet.href" + $interpolateProvider.endSymbol() + "' rel='stylesheet' />")(scope)); // Found here : http://stackoverflow.com/a/11913182/1662766
				}
				else {
					for (var i in scope.injectedStylesheets) {
						if (scope.injectedStylesheets[i].href == href) // An url can't be added more than once. I use a loop FOR, not the function indexOf to make the code IE < 9 compatible
							return;
					}
				}

				scope.injectedStylesheets.push({ href: href });
			};

			var remove = function (href) {
				_initScope();

				if (scope.injectedStylesheets) {
					for (var i = 0; i < scope.injectedStylesheets.length; i++) {
						if (scope.injectedStylesheets[i].href === href) {
							scope.injectedStylesheets.splice(i, 1);
							return;
						}
					}
				}
			};

			// Used to remove all of the CSS files added with the function `addStylesheet`
			var removeAll = function () {
				_initScope();

				if (scope.injectedStylesheets !== undefined)
					scope.injectedStylesheets = []; // Make it empty
			};

			return {
				add: addStylesheet,
				remove: remove,
				removeAll: removeAll
			};
		}

		this.$get = ['$compile', '$rootScope', '$rootElement', function ($compile, $rootScope, $rootElement) {
			return new CssInjector($compile, $rootScope, $rootElement);
		}];

		this.setSinglePageMode = function (mode) {
			singlePageMode = mode;
			return this;
		}
	}]);


vdsApp.factory("vdsGraphService", function (vdsServices) {
  var obj = {
    key: "test",
    updateKey: function () {
      obj.key = "test2";
    },
  };
  return obj;
});	

vdsApp.directive('barchart', function (vdsServices) {
	return {
		restrict: 'EA',
		template: '<div style="position: relative; float: left; width: 75%;"></div>',
		replace: true,

		controller: function ($scope) {
			/*$scope.$watch('data', function(){
				$scope.treeData = $scope.data;
			});*/

		},
		link: function ($scope, element, attrs) {
			var ChartDivwidth = "100%";
			var ChartDivheight = 470;
			var ChartInnerWidth = "80%";
			var ChartInnerHeight = "60%";
			

			google.charts.setOnLoadCallback(drawChart);
			var chartData = eval(attrs.chartdata);
			var colorArr = new Array();
			var defaultColorsArr = ['#21BCC6', '#0A6EC5', '#878ACC', '#8DB9E2', '#8E999F', '#000'];

			if (attrs.colorsarr != '') {
				colorArr = eval(attrs.colorsarr);
			}
			else {
				colorArr = defaultColorsArr;
			}

			/************** Section to Identify Missing columns *******************/
			var notFound, arrayDefined1;
			var res = chartData.toString().split(",");
			
			notFound = ["For", "Against/Withhold", "Abstain", "Did Not Vote"]; //,"One Year"
			arrayDefined1 = ["For", "Against/Withhold", "Abstain", "Did Not Vote"];//,"One Year"
			var totLengthArray = arrayDefined1.length;
			for (i = 0; i < arrayDefined1.length; i++) {
				for (j = 0; j < res.length; j++) {
					//VDS-1961: enabled case insensitive checking to avoid extra category in case of 'DID NOT VOTE'
					if (arrayDefined1[i].toLowerCase() == res[j].toLowerCase()) {
						var index = notFound.indexOf(arrayDefined1[i]);
						notFound.splice(index, 1);
					}
				}
			}
			/************** Section to Identify Missing columns Ends ******************/
			var count = chartData.length;
			
			if (notFound.length == totLengthArray) {
				drawChartSingle();
				return false;
			} else {
				for (k = 0; k < notFound.length; k++) {
					var charArray = [notFound[k], 0];
					chartData[count] = charArray;
					count++;
				}

				for(i=0;i<chartData.length;i++)
			{
				
				if(chartData[i][0] != "" && vdsServices.getPreferLanguageProperties().voteDetailsList[chartData[i][0]] != null)
				{
					chartData[i][0] = vdsServices.getPreferLanguageProperties().voteDetailsList[chartData[i][0]];
				}
			}
			var chartDataVal = new Array();
			var txt;
			for (var i in chartData) {
				if (i > 0) {
					chartDataVal[i - 1] = parseInt(chartData[i][1]);
					chartData[i][2] = 'color:' + colorArr[(i - 1) % 6];
					if (chartData[i][1] > 1)
						txt = vdsServices.getPreferLanguageProperties().proposals;
					else
						txt = vdsServices.getPreferLanguageProperties().proposal;
					str = chartData[i][0] + ' | ' + numberWithCommas(chartData[i][1]) + txt;
					chartData[i][3] = createCustomHTMLContent(str);
					if (attrs.pdfchart == 1) {
						chartData[i][0] = chartData[i][0] + ' (' + numberWithCommas(chartData[i][1]) + ')';
						ChartDivwidth="110%";
						ChartDivheight=550;
						ChartInnerWidth="80%";
						ChartInnerHeight="65%";
					}
					else {
						chartData[i][0] = chartData[i][0];
					}
				}
			}
			var MaxArrayVal = Math.max.apply(Math, chartDataVal);

			var p = parseInt(MaxArrayVal / 1000);
			var divBy = 1000;
			var divByParam = 1000;
			var suffixSign = 'K';
			if (p == 0) {
				p = parseInt(MaxArrayVal / 100);
				divBy = 100;
				divByParam = 1;
				suffixSign = '';
				if (p == 0) {
					p = parseInt(MaxArrayVal / 10);
					divBy = 10;
					suffixSign = '';
					divByParam = 1;
				}
			}



			var abc = Math.ceil((MaxArrayVal / divBy));
			MaxArrayVal = abc * divBy;
			var vAxisTick = new Array();
			var j = 0;

			var RangeArr = new Array(7, 6, 5, 4);
			var valueMod;
			for (k = 0; k <= 3; k++) {
				valueMod = MaxArrayVal % RangeArr[k];
				if (valueMod == 0) {
					loopVar = RangeArr[k];
					break;
				}
			}
			for (i = 0; i <= loopVar; i++) {
				j = (i) * (MaxArrayVal / loopVar);
				k = ((j / divByParam)) + suffixSign;
				vAxisTick[i] = { v: j, f: k };
			}
			for (var i in chartData) {
				if (i > 0) {
					if ((chartData[i][1] / MaxArrayVal) <= 0.025) {
						if (chartData[i][1] > 0) {
							chartData[i][1] = MaxArrayVal * 2.5 / 100;
						} else {
							chartData[i][1] = -0.000001;
							chartData[i][2] = 'color: #000;';
						}
					}
				}
			}
			function numberWithCommas(x) {
				return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}


			

			$scope.InteractiveGraphs = vdsServices.getPreference().InteractiveGraphs;

			

			function drawChart() {
				var data = google.visualization.arrayToDataTable(chartData);
				var groupWid = "76%";
				if (chartData.length > 3)
					groupWid = "76%";
				else
					groupWid = "20%";

				var view = new google.visualization.DataView(data);
				view.setColumns([0, 1,
					2,
					3]);

				var options = {
					//title: "Voting Statistics",
					/* width: 680, */
					width: ChartDivwidth,
					height: ChartDivheight,
					/*bar: {
						groupWidth : "76%"
					},*/
					legend: { position: "none" },
					//enableInteractivity: false,
					hAxis: {
						titleTextStyle: { color: $scope.hAxisTitleTextStyleColor },
						count: -1,
						viewWindowMode: 'pretty',
						/* viewWindow: {
							min: 1900,
							max: 16000
						},	*/
						slantedText: true,
						slantedTextAngle: 30,
						baselineColor: '#666',
						/*minValue: 1900, */
						gridlines: {
							color: "#666"
						},
						textStyle: {
							fontSize: $scope.hAxisTextStylefontSize,
							fontName: $scope.hAxisTextStyleFontName,
							color: $scope.hAxisTextStylecolor
						}
					},
					backgroundColor: $scope.backgroundColor,
					vAxis: {
						titleTextStyle: { color: $scope.vAxisTitleTextStyleColor },
						count: -1,
						baselineColor: $scope.vAxisBaselineColor,
						ticks: vAxisTick,
						textStyle: {
							fontSize: $scope.vAxisTextStylefontSize,
							fontName: $scope.vAxisTextStyleFontName,
							color: $scope.vAxisTextStylecolor
						},
						format: 'short'


					},
					chartArea: {
						width: ChartInnerWidth,
						height: ChartInnerHeight,
						left: 80,
						top: 50
					},
					tooltip: { isHtml: true }

				};

				myObj = { groupWidth: 55 };//groupWid
				//myObj[nbEGP] = {groupWidth : groupWid};				  
				options.bar = myObj;
				var chart = new google.visualization.ColumnChart(document.getElementById(attrs.id));
				
				
				chart.draw(view, options);
				
				if($scope.InteractiveGraphs == true)
				{
				google.visualization.events.addListener(chart, 'onmouseout', onmouseoutHandler);
				google.visualization.events.addListener(chart, 'onmouseover', onmouseoverHandler);
				google.visualization.events.addListener(chart, 'select', function() {
						chartObject = chart;
						var selection = chartObject.getSelection();
						if (selection.length) {
							showHideMeetingList($scope, "MeetingStatistics_list", "expandCollapseStatistics_list", 1);
							clearRemainingGraphselected($scope, "selectedStatisticsGraphList");
							//var x = '2px solid' + data.getValue(chartObject.getSelection()[0].row, 2).split(":").pop();
							//$('.selectedStatisticsGraphList').css('border', x).css('height', '44px');
							$('.selectedStatisticsGraphList').css('display','block');
							//$('.bannerHeaderGraph').css('color', data.getValue(chartObject.getSelection()[0].row, 2).split(":").pop());
							var selectedValue = data.getValue(chartObject.getSelection()[0].row, 0);
							var voteDetailsList = vdsServices.getPreferLanguageProperties().voteDetailsList;
							var finalData = '';
							for(var key in voteDetailsList)
							{
								var value = voteDetailsList[key];
								if(value == selectedValue)
								{
									finalData = key;
									break;
								}
							}
							if(finalData == '')
							{
								finalData = data.getValue(chartObject.getSelection()[0].row, 0);
							}							
							$scope.$apply(function() {
								$scope.$parent.selectedStatisticsGraphList.name = data.getValue(chartObject.getSelection()[0].row, 0);
								$scope.$parent.selectedStatisticsGraphList.clear = true;
							});
							if (finalData.indexOf("/") != -1) {
								finalData = finalData.replace("/", "%7C");
							}
							var map = [{ key: 'clientVote', value: finalData},{key: 'isInteractiveGraphCall', value: 1}];
							$scope.$parent.getMeetingList(map);
							//jQuery('#list').jqGrid('setGridParam', {page : 1,postData : {MeetingTypeList: '',CountryList: '',VotedList : '' }, MeetingTypeList: '',CountryList: '',VotedList : ''});						
							//jQuery("#list").trigger("reloadGrid");											
							$("#meetingDisplayGrid").show('500');
							var change = document.getElementById("expandCollapseStatistics_list");
							$("#" + "MeetingStatistics_list" + "_header").css("display", "block");
							change.innerHTML = "<span class='glyphicon glyphicon-minus'></span> " + vdsServices.getPreferLanguageProperties().Collapse + "";
						}
						else {


							// do something if the user deselects a point
							// alert('deselected');
							// showHideMeetingList($scope,"MeetingStatistics_list","expandCollapseStatistics_list",1);
							// $scope.$parent.getMeetingList();
							// jQuery('#list').jqGrid('setGridParam', {page : 1,postData : {MeetingTypeList: '',CountryList: '',VotedList : '' }, MeetingTypeList: '',CountryList: '',VotedList : ''});						
							// jQuery("#list").trigger("reloadGrid");
							// $("#meetingDisplayGrid").show('500');

							//For Toggle Button
							// change.innerHTML = "<span class='glyphicon glyphicon-plus'></span> " + vdsServices.getPreferLanguageProperties().Expand + "";
							// $("#" + "MeetingStatistics_list" + "_header").css("display", "none");
							// document.getElementById("expandCollapseStatistics_list").src = '/repo/' + vdsServices.getCustomerId() + '/img/expand.png';

						}

					});
				}
			}

			
			
					//location.href = 'http://www.google.com?row=' + row + '&col=' + col + '&year=' + year;
				//});
				//chart click end

			}
			function onmouseoverHandler() {
				document.getElementById(attrs.id).style.cursor = 'pointer';
			}
			function onmouseoutHandler() {
				document.getElementById(attrs.id).style.cursor = 'default';
			}
			drawChart();
			function createCustomHTMLContent(testElementVal) {
				return '<div style="font-weight:normal;">' + testElementVal + '</div>';
			}

			$(document).ready(function() {
				$(window).resize(function() {
					drawChart();
				});
			});

			function drawChartSingle() {
				var vAxisTick1 = new Array();
				for (i = 0; i <= 5; i++) {
					k = j = 2 * i;
					vAxisTick1[i] = { v: k, f: j };
				}

				//notFound =  ["For","Against/Withhold","Abstain","Did Not Vote","One Year"];			
				var data = google.visualization.arrayToDataTable([
					['', '', { role: 'style' }, { role: 'tooltip', 'p': { 'html': true } }],
					['For', -0.000001, 'color:#CCCCCC', '<div style="font-weight:normal;">For | 0 Proposal</div>'],
					['Against/Withhold', -0.000001, 'color:#CCCCCC', '<div style="font-weight:normal;">Abstain | 0 Proposal</div>'],
					['Did Not Vote', -0.000001, 'color:#CCCCCC', '<div style="font-weight:normal;">Did Not Vote | 0 Proposal</div>'],
					['Abstain', -0.000001, 'color:#CCCCCC', '<div style="font-weight:normal;">Abstain | 0 Proposal</div>']
					//,['One Year',0,'color:#CCCCCC','<div style="font-weight:normal;">One Year | 0 Proposal</div>']
				]);

				var options = {
					title: 'Voting Statistics',
					titleTextStyle: { color: '#666', fontName: 'Open Sans', fontSize: '16', fontWidth: 'normal' },
					titlePosition: 'none',
					width: '100%',
					height: 470,//'60%',	//400
					legend: { position: 'top', maxLines: 3 },
					/*series: {
						0: { }, // Output
						1: { 
							enableInteractivity: false, 
							tooltip: 'none', 
							lineDashStyle: [2, 2] 
						}
					},*/
					isStacked: 'true',
					colors: ['#E3E3E3'],
					tooltip: { isHtml: true },
					trigger: 'none',
					enableInteractivity: false,
					vAxis: {
						titleTextStyle: { color: $scope.vAxisTitleTextStyleColor },
						count: -1,
						viewWindowMode: 'pretty',
						textStyle: {
							fontSize: $scope.vAxisTextStylefontSize,
							color: $scope.vAxisTextStylecolor,
							fontName: $scope.vAxisTextStyleFontName
						},
						baselineColor: $scope.vAxisBaselineColor,
						viewWindowMode: 'explicit',
						viewWindow: {
							min: 0
						},
						ticks: vAxisTick1
					},
					backgroundColor: $scope.backgroundColor,
					hAxis: {
						titleTextStyle: { color: $scope.hAxisTitleTextStyleColor },
						count: -1,
						viewWindowMode: 'pretty',
						slantedText: true,
						slantedTextAngle: 45,
						textStyle: {
							fontSize: $scope.hAxisTextStylefontSize,
							color: $scope.hAxisTextStylecolor,
							fontName: $scope.hAxisTextStyleFontName,
						},
						/*baselineColor: '#666'*/
					},
					chartArea: {
						width: '100%',
						height: '73%',
						left: 70,
						top: 10,
						right: 0,
						//bottom: 0
					},
					bar: { groupWidth: 55 }
				};

				var ac = new google.visualization.ColumnChart(document.getElementById(attrs.id));
				$('#' + attrs.id).css('visibility', 'visible')
					.css('height', '470px');
				ac.draw(data, options);
			}
			if ('#' + attrs.id == "#votingStatisticsPDF") {
				//console.log($('#'+attrs.id));
				$('#' + attrs.id).css('display', 'none');
			}

		}
	};
});
vdsApp.directive('ngBrickChart', function (vdsServices) {

	return {
		restrict: 'EA',
		scope: {
			data: '=',
			forColor: '=',
			againstColor: '=',
			noDataColor: '=',
		},
		templateUrl: '/repo/app/js/directives/template/brickChart.html?version=' + vdsServices.getCSSJSVersion(),
		link: function (scope, element, attrs) {
			scope.$watch('data', function () {
			//for interactive graph
			scope.InteractiveGraphs = vdsServices.getPreference().InteractiveGraphs;
				document.getElementById("mgmt_chart").innerHTML = "";

				var count = scope.data.againstPercent;

				var noData = 0;


				if (scope.data.againstPercent == 0 && scope.data.forPercent == 0) {
					noData = 1;
				}

				var format = d3.format("0,000");
				var forColor = '';
				var againstColor = '';
				var noDataColor = '';
				if (attrs.forcolor != '') {
					forColor = attrs.forcolor;
				}
				else {
					forColor = "#00BCC6";
				}

				if (attrs.againstcolor != '') {
					againstColor = attrs.againstcolor;
				}
				else {
					againstColor = "#3366CC";
				}

				if (attrs.nodatacolor != '') {
					noDataColor = attrs.nodatacolor;
				}
				else {
					noDataColor = "#3366CC";
				}

				//var count = 4;
				var row = [];
				for (var i = 0; i < 5; i++) {
					row[i] = document.getElementById("mgmt_chart").insertRow(i);
					row[i].id = i;
				}
				for (var j = 0; j < 20; j++) {

					count = applyBackground(row[4], j, count);
					count = applyBackground(row[3], j, count);
					count = applyBackground(row[2], j, count);
					count = applyBackground(row[1], j, count);
					count = applyBackground(row[0], j, count);


				}

				scope.against = scope.data.againstPercent + "%";
				scope.forString = scope.data.forPercent + "%";
				scope.againstCount = format(scope.data.against);
				scope.forStringCount = format(scope.data.For);
				scope.againstLabel=vdsServices.getPreferLanguageProperties().againstLabel;
				scope.forLabel=vdsServices.getPreferLanguageProperties().forLabel;

				
			

				if(scope.InteractiveGraphs == true)
				{
				$('#mgmt_chart').css("cursor","pointer");
				$('.for').on('mouseover', function() {
					$('.for').addClass("forManagement");
					$('#brickTooltip').attr("hidden", false);
				});
				$('.for').on('mouseout', function() {
					$('.for').removeClass("forManagement");
					//cell.style.border = "1px solid white";
					$('#brickTooltip').attr("hidden", true);
				});
				$('.against').on('mouseover', function() {
					$('.against').addClass("forManagement");
					$('#brickTooltip').attr("hidden", false);
				});
				$('.against').on('mouseout', function() {
					$('.against').removeClass("forManagement");
					//cell.style.border = "1px solid white";
					$('#brickTooltip').attr("hidden", true);
				});
				}

				function applyBackground(row, column, count) {
					var cell = row.insertCell(column);
					var ua = window.navigator.userAgent;
					var msie = ua.indexOf("MSIE ");
					var tooltipStr = '';

					if (count > 0) {

						if (noData == 1) {
							//cell.style.backgroundColor = "#8e999f"; //grey	
							cell.style.backgroundColor = noDataColor; //grey	
						}
						else {
							//cell.style.backgroundColor = "#3366CC";	
							cell.className = 'against';
							cell.style.backgroundColor = againstColor;
						}

						cell.style.border = "1pt solid white";
						cell.onmousemove = function (event) {
							//console.log(event.pageX + '=>' + event.pageY);
							var leftValu = $('#votcastAgMgmt').offset().left;
							var topPix = $('#votcastAgMgmt').offset().top;
							if (msie > 0) {      // If Internet Explorer, return version number
								topPix = topPix + 5;
							} else {
								topPix = topPix + 30;
							}
							if (event.pageX > 520) {
								var xSubtract = 500
								var leftVal = event.pageX - xSubtract;
							}
							else {
								var xSubtract = 200;
								var leftVal = event.pageX - xSubtract;
							}

							if (leftVal < 0) {
								leftVal = 10;
							}

							if (noData == 1) {
								tooltipStr = '' + format(scope.data.against) +  vdsServices.getPreferLanguageProperties().votesCast;
							}
							else {
								tooltipStr = vdsServices.getPreferLanguageProperties().againstLabel +' |' + format(scope.data.against) + (scope.data.against > 1 ? vdsServices.getPreferLanguageProperties().votesCast : vdsServices.getPreferLanguageProperties().voteCast);
							}
							d3.select("#brickTooltip")
								.style("left", event.pageX - leftValu + "px")
								.style("top", event.pageY - topPix + "px")
								//.style("left", event.pageX - (event.pageX * 45 / 100)   +"px")
								//.style("top", event.pageY - (event.pageY / 3.5)  +"px")
								.html(tooltipStr);
							d3.select("#brickTooltip").classed("hidden", false);

						};
						cell.onmouseout = function(event)
						{
							d3.select("#brickTooltip").classed("hidden", true);
						}
						if(scope.InteractiveGraphs == true)
						{
						cell.onclick = function(event) {
							var selectedData = "AM";
							clearRemainingGraphselected(scope.$parent, "selectedManagementGraphList");
							//var x = '2px solid' + againstColor;
							//$('.selectedManagementGraphList').css('border', x).css('height', '44px');
							$('.selectedManagementGraphList').css('display','block');
							//$('.bannerHeaderGraph').css('color', againstColor);
							scope.$apply(function() {
								scope.$parent.$parent.selectedManagementGraphList.name = vdsServices.getPreferLanguageProperties().againstLabel;
								scope.$parent.$parent.selectedManagementGraphList.clear = true;

							});
							showHideMeetingList(scope.$parent, "MeetingManagement_list", "expandCollapseManagement_list", 1);
							var map = [{ key: 'managementCode', value: selectedData },{key: 'isInteractiveGraphCall', value: 1}];
							scope.$parent.$parent.getMeetingList(map);
							$("#meetingDisplayGrid").show('500');
							var change = document.getElementById("expandCollapseManagement_list");
							$("#" + "MeetingManagement_list" + "_header").css("display", "block");
							//change.innerHTML = "<span class='glyphicon glyphicon-minus'></span> " + vdsServices.getPreferLanguageProperties().Collapse + "";
						};
						}
						count--;
					} else {
						if (noData == 1) {
							//cell.style.backgroundColor = "#8e999f"; //grey	
							cell.style.backgroundColor = noDataColor; //grey
						}
						else {
							//cell.style.backgroundColor = "#00BCC6";
							cell.className = 'for';
							cell.style.backgroundColor = forColor;

						}
						cell.style.border = "1pt solid white";
						cell.onmousemove = function(event) {
							//console.log(event.pageX + '=>' + event.pageY);
							var leftValu = $('#votcastAgMgmt').offset().left;
							var topPix = $('#votcastAgMgmt').offset().top;
							if (msie > 0) {      // If Internet Explorer, return version number
								topPix = topPix + 5;
							} else {
								topPix = topPix + 30;
							}

							if (event.pageX > 520) {
								var xSubtract = 500
								var leftVal = event.pageX - xSubtract;
							}
							else {
								var xSubtract = 200;
								var leftVal = event.pageX - xSubtract;
							}

							if (leftVal < 0) {
								leftVal = 10;
							}

							if (noData == 1) {
								tooltipStr = '' + format(scope.data.For) + vdsServices.getPreferLanguageProperties().votesCast;
							}
							else {
								tooltipStr = vdsServices.getPreferLanguageProperties().forLabel +' | ' + format(scope.data.For) + (scope.data.For > 1 ? vdsServices.getPreferLanguageProperties().votesCast : vdsServices.getPreferLanguageProperties().voteCast);
							}
							d3.select("#brickTooltip")

								.style("left", event.pageX - leftValu + "px")
								.style("top", event.pageY - topPix + "px")
								//.style("left", event.pageX - (event.pageX * 45 / 100)   +"px")
								//.style("top", event.pageY - (event.pageY / 3.5)  +"px")

								.html(tooltipStr);
							d3.select("#brickTooltip").classed("hidden", false);

						};
						cell.onmouseout = function(event)
						{
							d3.select("#brickTooltip").classed("hidden", true);
						}
						
						if(scope.InteractiveGraphs == true)
						{
						cell.onclick = function(event) {
							var selectedData = "WM";
							clearRemainingGraphselected(scope.$parent, "selectedManagementGraphList");
							var x = '2px solid' + forColor;
							//$('.selectedManagementGraphList').css('border', x).css('height', '44px');
							//$('.bannerHeaderGraph').css('color', forColor);							
							$('.selectedManagementGraphList').css('display','block');
							scope.$apply(function() {
								scope.$parent.$parent.selectedManagementGraphList.name = vdsServices.getPreferLanguageProperties().forLabel;
								scope.$parent.$parent.selectedManagementGraphList.clear = true;
							});
							showHideMeetingList(scope.$parent, "MeetingManagement_list", "expandCollapseManagement_list", 1);
							var map = [{ key: 'managementCode', value: selectedData },{key: 'isInteractiveGraphCall', value: 1}];
							scope.$parent.$parent.getMeetingList(map);
							$("#meetingDisplayGrid").show('500');
							var change = document.getElementById("expandCollapseManagement_list");
							$("#" + "MeetingManagement_list" + "_header").css("display", "block");
							//change.innerHTML = "<span class='glyphicon glyphicon-minus'></span> " + vdsServices.getPreferLanguageProperties().Collapse + "";
						};
						}
					}

					return count;
				};
			});

		}
	}
});
vdsApp.directive('ngCustomFilter', function () {

	return {
		restrict: 'AE',
		scope: {
			/*      meetingTypeList : '=meetingTypeList'*/
			typeList: '=',
			control: '=',
			elementId: '@',
			blockIndex: '@'
		},
		templateUrl: '/repo/directives/template/customFilter.html',
		controller: function ($scope) {
			$scope.selectedType = [];
			$scope.selectAll = false;

			//   console.log("elementId" + $scope.elementId);

		},
		link: function (scope, element, attrs) {


			/*  	  scope.$watch(attrs.list, function(newVal) {
					  	
								if(newVal && newVal.length > 0) { 
								scope.typeList = attrs.list;
								  scope.control = attrs.control;
								  scope.elementId = attrs.elementId;
									
								}
					  	
						  }, true);
					*/



			/*scope.$watch(function() {
				return scope.meetingTypeList;
			});*/


			//console.log("made into the custome filter directive link");

			//@todo : make filtering code this generic    

			/*    	console.log(meetingTypeList);
					  scope.$watch('meetingTypeList', function(meetingTypeList) {

						  });
			   */



			scope.setSelectedType = function () {

				var name = this.type.name;
				if (_.contains(scope.selectedType, name)) {
					scope.selectedType = _.without(scope.selectedType, name);
					scope.selectAll = false;
				} else {
					scope.selectedType.push(name);
					if (scope.selectedType.length == scope.typeList.length) {
						scope.selectAll = true;
					}
				}
				// scope.filterData();
				scope.control(scope.selectedType, scope.elementId);
				//  scope.dayDataCollapseFn(scope.model.length);

				return false;
			};


			scope.checkUncheckAll = function () {
				angular.forEach(scope.typeList, function (type) {

					type.checked = scope.selectAll;
				});
				scope.selectedType = scope.selectAll ? _.pluck(scope.typeList, 'name') : [];

				scope.control(scope.selectedType, scope.elementId);
				//  scope.filterData();
				//  scope.dayDataCollapseFn(scope.model.length);

			}

			scope.toggleDropdown = function (id) {
				$('#' + id).toggleClass("open");
			};

			scope.closeDropdown = function (id) {
				$('#' + id).removeClass('open');
			};




		}
	}
});
(function () {

    /**
     * Config
     */
	var moduleName = 'angularUtils.directives.dirPagination';
	var DEFAULT_ID = '__default';

    /**
     * Module
     */
	var module;
	try {
		module = angular.module(moduleName);
	} catch (err) {
		// named module does not exist, so create one
		module = angular.module(moduleName, []);
	}

	module
		.directive('dirPaginate', ['$compile', '$parse', 'paginationService', dirPaginateDirective])
		.directive('dirPaginateNoCompile', noCompileDirective)
		.directive('dirPaginationControls', ['paginationService', 'paginationTemplate', dirPaginationControlsDirective])
		.filter('itemsPerPage', ['paginationService', itemsPerPageFilter])
		.service('paginationService', paginationService)
		.provider('paginationTemplate', paginationTemplateProvider)
		.run(['$templateCache', dirPaginationControlsTemplateInstaller]);

	function dirPaginateDirective($compile, $parse, paginationService) {

		return {
			terminal: true,
			multiElement: true,
			compile: dirPaginationCompileFn
		};

		function dirPaginationCompileFn(tElement, tAttrs) {

			var expression = tAttrs.dirPaginate;
			// regex taken directly from https://github.com/angular/angular.js/blob/master/src/ng/directive/ngRepeat.js#L211
			var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);

			var filterPattern = /\|\s*itemsPerPage\s*:[^|]*/;
			if (match[2].match(filterPattern) === null) {
				throw 'pagination directive: the \'itemsPerPage\' filter must be set.';
			}
			var itemsPerPageFilterRemoved = match[2].replace(filterPattern, '');
			var collectionGetter = $parse(itemsPerPageFilterRemoved);

			addNoCompileAttributes(tElement);

			// If any value is specified for paginationId, we register the un-evaluated expression at this stage for the benefit of any
			// dir-pagination-controls directives that may be looking for this ID.
			var rawId = tAttrs.paginationId || DEFAULT_ID;
			paginationService.registerInstance(rawId);

			return function dirPaginationLinkFn(scope, element, attrs) {

				// Now that we have access to the `scope` we can interpolate any expression given in the paginationId attribute and
				// potentially register a new ID if it evaluates to a different value than the rawId.
				var paginationId = $parse(attrs.paginationId)(scope) || attrs.paginationId || DEFAULT_ID;
				paginationService.registerInstance(paginationId);

				var repeatExpression = getRepeatExpression(expression, paginationId);
				addNgRepeatToElement(element, attrs, repeatExpression);

				removeTemporaryAttributes(element);
				var compiled = $compile(element);

				var currentPageGetter = makeCurrentPageGetterFn(scope, attrs, paginationId);
				paginationService.setCurrentPageParser(paginationId, currentPageGetter, scope);

				if (typeof attrs.totalItems !== 'undefined') {
					paginationService.setAsyncModeTrue(paginationId);
					scope.$watch(function () {
						return $parse(attrs.totalItems)(scope);
					}, function (result) {
						if (0 <= result) {
							paginationService.setCollectionLength(paginationId, result);
						}
					});
				} else {
					scope.$watchCollection(function () {
						return collectionGetter(scope);
					}, function (collection) {
						if (collection) {
							paginationService.setCollectionLength(paginationId, collection.length);
						}
					});
				}

				// Delegate to the link function returned by the new compilation of the ng-repeat
				compiled(scope);
			};
		}

        /**
         * If a pagination id has been specified, we need to check that it is present as the second argument passed to
         * the itemsPerPage filter. If it is not there, we add it and return the modified expression.
         *
         * @param expression
         * @param paginationId
         * @returns {*}
         */
		function getRepeatExpression(expression, paginationId) {
			var repeatExpression,
				idDefinedInFilter = !!expression.match(/(\|\s*itemsPerPage\s*:[^|]*:[^|]*)/);

			if (paginationId !== DEFAULT_ID && !idDefinedInFilter) {
				repeatExpression = expression.replace(/(\|\s*itemsPerPage\s*:[^|]*)/, "$1 : '" + paginationId + "'");
			} else {
				repeatExpression = expression;
			}

			return repeatExpression;
		}

        /**
         * Adds the ng-repeat directive to the element. In the case of multi-element (-start, -end) it adds the
         * appropriate multi-element ng-repeat to the first and last element in the range.
         * @param element
         * @param attrs
         * @param repeatExpression
         */
		function addNgRepeatToElement(element, attrs, repeatExpression) {
			if (element[0].hasAttribute('dir-paginate-start') || element[0].hasAttribute('data-dir-paginate-start')) {
				// using multiElement mode (dir-paginate-start, dir-paginate-end)
				attrs.$set('ngRepeatStart', repeatExpression);
				element.eq(element.length - 1).attr('ng-repeat-end', true);
			} else {
				attrs.$set('ngRepeat', repeatExpression);
			}
		}

        /**
         * Adds the dir-paginate-no-compile directive to each element in the tElement range.
         * @param tElement
         */
		function addNoCompileAttributes(tElement) {
			angular.forEach(tElement, function (el) {
				if (el.nodeType === Node.ELEMENT_NODE) {
					angular.element(el).attr('dir-paginate-no-compile', true);
				}
			});
		}

        /**
         * Removes the variations on dir-paginate (data-, -start, -end) and the dir-paginate-no-compile directives.
         * @param element
         */
		function removeTemporaryAttributes(element) {
			angular.forEach(element, function (el) {
				if (el.nodeType === Node.ELEMENT_NODE) {
					angular.element(el).removeAttr('dir-paginate-no-compile');
				}
			});
			element.eq(0).removeAttr('dir-paginate-start').removeAttr('dir-paginate').removeAttr('data-dir-paginate-start').removeAttr('data-dir-paginate');
			element.eq(element.length - 1).removeAttr('dir-paginate-end').removeAttr('data-dir-paginate-end');
		}

        /**
         * Creates a getter function for the current-page attribute, using the expression provided or a default value if
         * no current-page expression was specified.
         *
         * @param scope
         * @param attrs
         * @param paginationId
         * @returns {*}
         */
		function makeCurrentPageGetterFn(scope, attrs, paginationId) {
			var currentPageGetter;
			if (attrs.currentPage) {
				currentPageGetter = $parse(attrs.currentPage);
			} else {
				// if the current-page attribute was not set, we'll make our own
				var defaultCurrentPage = paginationId + '__currentPage';
				scope[defaultCurrentPage] = 1;
				currentPageGetter = $parse(defaultCurrentPage);
			}
			return currentPageGetter;
		}
	}

    /**
     * This is a helper directive that allows correct compilation when in multi-element mode (ie dir-paginate-start, dir-paginate-end).
     * It is dynamically added to all elements in the dir-paginate compile function, and it prevents further compilation of
     * any inner directives. It is then removed in the link function, and all inner directives are then manually compiled.
     */
	function noCompileDirective() {
		return {
			priority: 5000,
			terminal: true
		};
	}

	function dirPaginationControlsTemplateInstaller($templateCache) {
		$templateCache.put('angularUtils.directives.dirPagination.template', '<ul class="pagination" ng-if="1 < pages.length"><li ng-if="boundaryLinks" ng-class="{ disabled : pagination.current == 1 }"><a href="" ng-click="setCurrent(1)">&laquo;</a></li><li ng-if="directionLinks" ng-class="{ disabled : pagination.current == 1 }"><a href="" ng-click="setCurrent(pagination.current - 1)">&lsaquo;</a></li><li ng-repeat="pageNumber in pages track by $index" ng-class="{ active : pagination.current == pageNumber, disabled : pageNumber == \'...\' }"><a href="" ng-click="setCurrent(pageNumber)">{{ pageNumber }}</a></li><li ng-if="directionLinks" ng-class="{ disabled : pagination.current == pagination.last }"><a href="" ng-click="setCurrent(pagination.current + 1)">&rsaquo;</a></li><li ng-if="boundaryLinks"  ng-class="{ disabled : pagination.current == pagination.last }"><a href="" ng-click="setCurrent(pagination.last)">&raquo;</a></li></ul>');
	}

	function dirPaginationControlsDirective(paginationService, paginationTemplate) {

		var numberRegex = /^\d+$/;

		return {
			restrict: 'AE',
			templateUrl: function (elem, attrs) {
				return attrs.templateUrl || paginationTemplate.getPath();
			},
			scope: {
				maxSize: '=?',
				onPageChange: '&?',
				paginationId: '=?'
			},
			link: dirPaginationControlsLinkFn
		};

		function dirPaginationControlsLinkFn(scope, element, attrs) {

			// rawId is the un-interpolated value of the pagination-id attribute. This is only important when the corresponding dir-paginate directive has
			// not yet been linked (e.g. if it is inside an ng-if block), and in that case it prevents this controls directive from assuming that there is
			// no corresponding dir-paginate directive and wrongly throwing an exception.
			var rawId = attrs.paginationId || DEFAULT_ID;
			var paginationId = scope.paginationId || attrs.paginationId || DEFAULT_ID;

			if (!paginationService.isRegistered(paginationId) && !paginationService.isRegistered(rawId)) {
				var idMessage = (paginationId !== DEFAULT_ID) ? ' (id: ' + paginationId + ') ' : ' ';
				throw 'pagination directive: the pagination controls' + idMessage + 'cannot be used without the corresponding pagination directive.';
			}

			if (!scope.maxSize) { scope.maxSize = 9; }
			scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : true;
			scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : false;

			var paginationRange = Math.max(scope.maxSize, 5);
			scope.pages = [];
			scope.pagination = {
				last: 1,
				current: 1
			};
			scope.range = {
				lower: 1,
				upper: 1,
				total: 1
			};

			scope.$watch(function () {
				return (paginationService.getCollectionLength(paginationId) + 1) * paginationService.getItemsPerPage(paginationId);
			}, function (length) {
				if (0 < length) {
					generatePagination();
				}
			});

			scope.$watch(function () {
				return (paginationService.getItemsPerPage(paginationId));
			}, function (current, previous) {
				if (current != previous && typeof previous !== 'undefined') {
					goToPage(scope.pagination.current);
				}
			});

			scope.$watch(function () {
				return paginationService.getCurrentPage(paginationId);
			}, function (currentPage, previousPage) {
				if (currentPage != previousPage) {
					goToPage(currentPage);
				}
			});

			scope.setCurrent = function (num) {
				if (isValidPageNumber(num)) {
					num = parseInt(num, 10);
					paginationService.setCurrentPage(paginationId, num);
				}
			};

			function goToPage(num) {
				if (isValidPageNumber(num)) {
					scope.pages = generatePagesArray(num, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
					scope.totalPages = calculateTotalPages(paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId));
					scope.pagination.current = num;
					updateRangeValues();

					// if a callback has been set, then call it with the page number as an argument
					if (scope.onPageChange) {
						scope.onPageChange({ newPageNumber: num });
					}
				}
			}

			function generatePagination() {
				var page = parseInt(paginationService.getCurrentPage(paginationId)) || 1;

				scope.pages = generatePagesArray(page, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
				scope.totalPages = calculateTotalPages(paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId));
				scope.pagination.current = page;
				scope.pagination.last = scope.pages[scope.pages.length - 1];
				if (scope.pagination.last < scope.pagination.current) {
					scope.setCurrent(scope.pagination.last);
				} else {
					updateRangeValues();
				}
			}

            /**
             * This function updates the values (lower, upper, total) of the `scope.range` object, which can be used in the pagination
             * template to display the current page range, e.g. "showing 21 - 40 of 144 results";
             */
			function updateRangeValues() {
				var currentPage = paginationService.getCurrentPage(paginationId),
					itemsPerPage = paginationService.getItemsPerPage(paginationId),
					totalItems = paginationService.getCollectionLength(paginationId);

				scope.range.lower = (currentPage - 1) * itemsPerPage + 1;
				scope.range.upper = Math.min(currentPage * itemsPerPage, totalItems);
				scope.range.total = totalItems;
			}

			function isValidPageNumber(num) {
				return (numberRegex.test(num) && (0 < num && num <= scope.pagination.last));
			}
		}

        /**
         * Generate an array of page numbers (or the '...' string) which is used in an ng-repeat to generate the
         * links used in pagination
         *
         * @param currentPage
         * @param rowsPerPage
         * @param paginationRange
         * @param collectionLength
         * @returns {Array}
         */
		function generatePagesArray(currentPage, collectionLength, rowsPerPage, paginationRange) {
			var pages = [];

			for (var j = 1; j <= calculateTotalPages(collectionLength, rowsPerPage); j++) {
				pages.push(j);
			}
            /*var totalPages = Math.ceil(collectionLength / rowsPerPage);
            var halfWay = Math.ceil(paginationRange / 2);
            var position;

            if (currentPage <= halfWay) {
                position = 'start';
            } else if (totalPages - halfWay < currentPage) {
                position = 'end';
            } else {
                position = 'middle';
            }

            var ellipsesNeeded = paginationRange < totalPages;
            var i = 1;
            while (i <= totalPages && i <= paginationRange) {
                var pageNumber = calculatePageNumber(i, currentPage, paginationRange, totalPages);

                var openingEllipsesNeeded = (i === 2 && (position === 'middle' || position === 'end'));
                var closingEllipsesNeeded = (i === paginationRange - 1 && (position === 'middle' || position === 'start'));
                if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
                    pages.push('...');
                } else {
                    pages.push(pageNumber);
                }
                i ++;
            }*/
			return pages;
		}

		function calculateTotalPages(collectionLength, rowsPerPage) {

			return totalPages = Math.ceil(collectionLength / rowsPerPage);
		}
        /**
         * Given the position in the sequence of pagination links [i], figure out what page number corresponds to that position.
         *
         * @param i
         * @param currentPage
         * @param paginationRange
         * @param totalPages
         * @returns {*}
         */
		function calculatePageNumber(i, currentPage, paginationRange, totalPages) {
			var halfWay = Math.ceil(paginationRange / 2);
			if (i === paginationRange) {
				return totalPages;
			} else if (i === 1) {
				return i;
			} else if (paginationRange < totalPages) {
				if (totalPages - halfWay < currentPage) {
					return totalPages - paginationRange + i;
				} else if (halfWay < currentPage) {
					return currentPage - halfWay + i;
				} else {
					return i;
				}
			} else {
				return i;
			}
		}
	}

    /**
     * This filter slices the collection into pages based on the current page number and number of items per page.
     * @param paginationService
     * @returns {Function}
     */
	function itemsPerPageFilter(paginationService) {

		return function (collection, itemsPerPage, paginationId) {
			if (typeof (paginationId) === 'undefined') {
				paginationId = DEFAULT_ID;
			}
			if (!paginationService.isRegistered(paginationId)) {
				throw 'pagination directive: the itemsPerPage id argument (id: ' + paginationId + ') does not match a registered pagination-id.';
			}
			var end;
			var start;
			if (collection instanceof Array) {
				itemsPerPage = parseInt(itemsPerPage) || 9999999999;
				if (paginationService.isAsyncMode(paginationId)) {
					start = 0;
				} else {
					start = (paginationService.getCurrentPage(paginationId) - 1) * itemsPerPage;
				}
				end = start + itemsPerPage;
				paginationService.setItemsPerPage(paginationId, itemsPerPage);

				return collection.slice(start, end);
			} else {
				return collection;
			}
		};
	}

    /**
     * This service allows the various parts of the module to communicate and stay in sync.
     */
	function paginationService() {

		var instances = {};
		var lastRegisteredInstance;

		this.registerInstance = function (instanceId) {
			if (typeof instances[instanceId] === 'undefined') {
				instances[instanceId] = {
					asyncMode: false
				};
				lastRegisteredInstance = instanceId;
			}
		};

		this.isRegistered = function (instanceId) {
			return (typeof instances[instanceId] !== 'undefined');
		};

		this.getLastInstanceId = function () {
			return lastRegisteredInstance;
		};

		this.setCurrentPageParser = function (instanceId, val, scope) {
			instances[instanceId].currentPageParser = val;
			instances[instanceId].context = scope;
		};
		this.setCurrentPage = function (instanceId, val) {
			instances[instanceId].currentPageParser.assign(instances[instanceId].context, val);
		};
		this.getCurrentPage = function (instanceId) {
			var parser = instances[instanceId].currentPageParser;
			return parser ? parser(instances[instanceId].context) : 1;
		};

		this.setItemsPerPage = function (instanceId, val) {
			instances[instanceId].itemsPerPage = val;
		};
		this.getItemsPerPage = function (instanceId) {
			return instances[instanceId].itemsPerPage;
		};

		this.setCollectionLength = function (instanceId, val) {
			instances[instanceId].collectionLength = val;
		};
		this.getCollectionLength = function (instanceId) {
			return instances[instanceId].collectionLength;
		};

		this.setAsyncModeTrue = function (instanceId) {
			instances[instanceId].asyncMode = true;
		};

		this.isAsyncMode = function (instanceId) {
			return instances[instanceId].asyncMode;
		};
	}

    /**
     * This provider allows global configuration of the template path used by the dir-pagination-controls directive.
     */
	function paginationTemplateProvider() {

		var templatePath = 'angularUtils.directives.dirPagination.template';

		this.setPath = function (path) {
			templatePath = path;
		};

		this.$get = function () {
			return {
				getPath: function () {
					return templatePath;
				}
			};
		};
	}
})();
vdsApp.directive('ngDonutchart', function (browser, vdsServices) {

	return {
		restrict: 'EA',
		templateUrl: '/repo/app/js/directives/template/donutChart.html?version=' + vdsServices.getCSSJSVersion(),
		scope: {
			data: '=',
			colorsArr: '='
		},

		controller: function($scope) {
			$scope.ExpandButtonText = vdsServices.getPreferLanguageProperties().Expand;
			$scope.CollapseButtonText = vdsServices.getPreferLanguageProperties().Collapse;
			var getCustomOrCommonData = function(custom, common) {
				var CustomOrCommonData = '';
				if (custom != '' && custom != undefined) {
					CustomOrCommonData = custom;
				}
				else {
					CustomOrCommonData = common;
				}
				return CustomOrCommonData;
			};
			$scope.newExpandButtonFormat = getCustomOrCommonData(vdsServices.getCustomProperties().newExpandButtonFormat, vdsServices.getDashboardProperties().newExpandButtonFormat);

		},
		link: function (scope, element, attrs) {
			scope.$watch('data', function () {


	
			
				for(i=0;i<scope.data.data.length;i++)
				{
					
					if( vdsServices.getPreferLanguageProperties()[scope.data.data[i].id.trim()] != null)
					{
						scope.data.data[i].id = vdsServices.getPreferLanguageProperties()[scope.data.data[i].id.trim()];
					}
				}
				
				

				var width = 450,
					height = 350,
					radius = Math.min(width, height) / 2;

				var colorArr = new Array();

				var defaultColorsArr = ["#00BCC6", "#0A6EC5", "#878ACC", "#8DB9E2", "#8E999F", "#85b7e2", "#000000"];

				if (attrs.colorsarr != '') {
					colorArr = eval(attrs.colorsarr);
				}
				else {
					colorArr = defaultColorsArr;
				}
				var color = d3.scale.ordinal()
					.range(colorArr);

				var arc = d3.svg.arc()
					.outerRadius(radius - 5)
					.innerRadius(radius - 75);

				var pie = d3.layout.pie()
					.sort(null)
					.value(function(d) {
						return d.value;
					});


				var div = d3.select("body").append("div").attr("class", "toolTip");

				//scope.totalVoted = d3.sum(scope.data, function(d) { return d.value });

				//console.log(scope.data.totalMeetings);
					
				scope.InteractiveGraphs = vdsServices.getPreference().InteractiveGraphs;
				var svg = d3.select("#donutChartDiv").append("svg")
					.attr("width", '100%')
					.attr("height", '100%')
					//.style("margin-top","2%")
					.attr("viewBox", "-41 -5 529 342")
					.attr("width", "65%")
					//.attr("class", "col-md-8 col-sm-8 col-xs-8")
					/*.style("max-height","500px")
					.style("max-width","500px")
					.style("min-height","210px")
					//.style("min-width","210px")*/
					.style("padding", "0px")
					.attr("preserveAspectRatio", "xMinYMin meet")
					.append("g")
					.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

				var g = svg.selectAll(".arc")
					.data(pie(scope.data.data))
					.enter().append("g")
					.attr("class", "arc");

				g.append("path")
					.attr("d", arc)
					.transition().delay(function (d, i) { return i * 100; }).duration(500)
					.attrTween('d', function (d) {
						var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
						return function (t) {
							d.endAngle = i(t);
							return arc(d);
						}
					})
					.attr("name", function(d) {
						return d.data.id;
					})
					.style("fill", function(d) {
						return color(d.data.id);
					});
				var format = d3.format("0,000");
				var arcOver = d3.svg.arc()  // Size of donut chart when hovering
					.outerRadius(radius + 5)
					.innerRadius(90);
				
				g.on("mousemove", function(d) {
					var leftValu = $('#donutChartDiv').offset().left;
					var topPix = $('#donutChartDiv').offset().top;
					d3.select("#tooltip")
						.style("left", d3.event.clientX + "px")
						.style("top", d3.event.clientY - 50 + "px")
						//.style("left", d3.event.pageX- leftValu + 165 +"px")
						//.style("top", d3.event.pageY - topPix + 65 +"px")
						.style("z-index", 10000)
						.html((d.data.id) + " | " + format(d.data.meetingsCount) + (d.data.meetingsCount > 1 ? vdsServices.getPreferLanguageProperties().MeetingsLabel : vdsServices.getPreferLanguageProperties().MeetingLabel));
					d3.select("#tooltip").classed("hidden", false);
					if(scope.InteractiveGraphs == true)
					{
						d3.select(this).select("path").transition().duration(100)
						.attr("d", arcOver).style("cursor", "pointer");
					}
				});
				g.on("mouseout", function(d) {
					d3.select("#tooltip").classed("hidden", true);
					d3.select(this).select("path").transition()
						.duration(100)
						.attr("d", arc);
				});
				if(scope.InteractiveGraphs == true)
				{
				g.on("click", function(d) {
					var url = scope.$parent.$parent.actualUrl;
					var selectedOptions = d3.select(this).select("path").attr('name');
					$('.messageCheckbox:checked').each(function() {
						selectedOptions;
					});
					var selArr = selectedOptions.split('||');
					var selLen = selArr.length;	//count total no of "selected" checkboxes in filter div
					var totalCheckboxes = $('.messageCheckbox').size(); //count no of checkboxes in filter div
					if (selLen == totalCheckboxes - 1)	//if all checkboxes are selected, this means reset filter to be activated
					{
						selectedOptions = '';	//empty the options to force "reset filter"
					}
					var meetingTypeStr = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');
					meetingTypeStr = selectedOptions;
					//showHideMeetingList(this,"MeetingType_list","expandCollapseType_list",2);
					clearRemainingGraphselected(scope.$parent, "selectedMeetingTypeGraphList");
					var selectedValue = meetingTypeStr;
					var meetingTypeDetailList = vdsServices.getPreferLanguageProperties();
					var finalData = '';
					for(var key in meetingTypeDetailList)
						{
							var value = meetingTypeDetailList[key];
							if(value == selectedValue)
							{
								finalData = key;
								break;
							}
						}
						if(finalData == '')
						{
							finalData = selectedValue;
						}						
					scope.$parent.$apply(function() {
						scope.$parent.$parent.selectedMeetingTypeGraphList.name = selectedOptions;
						scope.$parent.$parent.selectedMeetingTypeGraphList.clear = true;
					});
					//$('.bannerHeaderGraph').css('color', d3.select(this).select("path").style('fill'));
					//var x = '2px solid';
					//$('.selectedMeetingTypeGraphList').css('border', x);
					//$('.selectedMeetingTypeGraphList').css('color', d3.select(this).select("path").style('fill')).css('height', '44px');
					$('.selectedMeetingTypeGraphList').css('display','block');
					$('#filterDropSearch').hide('500');	//close filter box
					jQuery('#list').jqGrid('setGridParam', { url: url, page: 1, postData: { MeetingTypeList: finalData, isInteractiveGraphCall: 1, CountryList: '', VotedList: '',actionCode: 117,sessionToken:loggerHelperConfig.sessionToken }, MeetingTypeList: finalData, CountryList: '', VotedList: '' });
					jQuery("#list").trigger("reloadGrid");
					showHideMeetingListByCriteria(this, "MeetingType_list", "expandCollapseType_list", 2);
					scope.$parent.$parent.updateMeetingListURLParameter(scope.$parent.$parent.meetingListTemplateUrl,'MeetingTypeList',meetingTypeStr + "&isInteractiveGraphCall=1");
					scope.$parent.$parent.updateMeetingDetailURLParameter(scope.$parent.$parent.meetingDetailTemplateUrl,'MeetingTypeList',meetingTypeStr);
					//var change = document.getElementById("expandCollapseMarket_list");
					//$("#" + "MeetingMarket_list" + "_header").css("display", "block");
					//change.innerHTML = "<span class='glyphicon glyphicon-minus'></span> " + vdsServices.getPreferLanguageProperties().Collapse + "";
				});
			}
				svg.append("text")
					.attr("dy", "0em")
					.style("text-anchor", "middle")
					.attr("class", "bannerHeader")
					.style("fill", '#999999')
					.text(function (d) { return (scope.data.totalMeetings + "").replace(/.(?=(?:.{3})+$)/g, '$&,'); });
				svg.append("text")
					.attr("dy", "1em")
					.style("text-anchor", "middle")
					.attr("class", "bannerHeader inside")
					.style("fill", '#999999')
					//.text(function(d) { return "Meetings"; });
					.text(function (d) { return (scope.data.totalMeetings > 1 ? vdsServices.getPreferLanguageProperties().MeetingsLabel : vdsServices.getPreferLanguageProperties().MeetingLabel); });


				var legend = d3.select("#donutChartDiv").append("svg")
					//.attr("class", "legend col-md-4 col-sm-4 col-xs-4")
					.attr("class", "donutLegend")
					.attr("width", "35%")
					.style("margin-right", "-37px")
					.style("float", "right")
					.style("font-family", '"Open Sans",​sans-serif')
					.attr("viewBox", "0 -7 230 185")
					.attr("preserveAspectRatio", "xMinYMin meet")

					//.attr("width", radius * 1.5)
					.attr("height", radius * 1.75)
					.selectAll("g")
					.data(scope.data.data)
					.enter().append("g")
					.attr("transform", function (d, i) {
						return "translate(0," + i * 35 + ")";
					});

				var rect = legend.append("rect")
					.attr("width", 18)
					.attr("height", 18)
					.attr("class", "rectangle")
					.attr("name", function(d)  //for dynamic filtering
					{
						return d.id;
					})
					.style("fill", function(d) {
						return color(d.id);
					});
				if(scope.InteractiveGraphs == true)
				{	
				legend.on("click", function(d) {
						var url = scope.$parent.$parent.actualUrl;
						var selectedOptions = d.id;
						$('.messageCheckbox:checked').each(function() {

							selectedOptions;
						});

						var selArr = selectedOptions.split('||');
						var selLen = selArr.length;	//count total no of "selected" checkboxes in filter div
						var totalCheckboxes = $('.messageCheckbox').size(); //count no of checkboxes in filter div


						if (selLen == totalCheckboxes - 1)	//if all checkboxes are selected, this means reset filter to be activated
						{
							selectedOptions = '';	//empty the options to force "reset filter"
						}

						var meetingTypeStr = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');
						meetingTypeStr = selectedOptions;
						//showHideMeetingList(this,"MeetingType_list","expandCollapseType_list",2);
						clearRemainingGraphselected(scope.$parent, "selectedMeetingTypeGraphList");
						var selectedValue = meetingTypeStr;
						var meetingTypeDetailList = vdsServices.getPreferLanguageProperties();
						var finalData = '';
						for(var key in meetingTypeDetailList)
						{
							var value = meetingTypeDetailList[key];
							if(value == selectedValue)
							{
								finalData = key;
								break;
							}
						}
						if(finalData == '')
						{
							finalData = selectedValue;
						}
						scope.$parent.$apply(function() {
							scope.$parent.$parent.selectedMeetingTypeGraphList.name = selectedOptions;
							scope.$parent.$parent.selectedMeetingTypeGraphList.clear = true;
						});
						//$('.bannerHeaderGraph').css('color', d3.select(this).style('fill'));
						//var x = '2px solid';
						//$('.selectedMeetingTypeGraphList').css('border', x);
						//$('.selectedMeetingTypeGraphList').css('color', d3.select(this).style('fill'));
						$('.selectedMeetingTypeGraphList').css('display','block');
						$('#filterDropSearch').hide('500');	//close filter box
						jQuery('#list').jqGrid('setGridParam', { url: url, page: 1, postData: { MeetingTypeList: finalData, isInteractiveGraphCall: 1, CountryList: '', VotedList: '',actionCode: 117,sessionToken:loggerHelperConfig.sessionToken }, MeetingTypeList: finalData, CountryList: '', VotedList: '' });
						jQuery("#list").trigger("reloadGrid");
						showHideMeetingListByCriteria(this, "MeetingType_list", "expandCollapseType_list", 2);
						scope.$parent.$parent.updateMeetingListURLParameter(scope.$parent.$parent.meetingListTemplateUrl,'MeetingTypeList',meetingTypeStr + "&isInteractiveGraphCall=1");
						scope.$parent.$parent.updateMeetingDetailURLParameter(scope.$parent.$parent.meetingDetailTemplateUrl,'MeetingTypeList',meetingTypeStr);
					});
				$("#donutChartDiv rect.rectangle").hover(function() {
						$(this).css('stroke', 'rgb(255, 255, 255)').css('stroke-width', '4px').css('cursor', 'pointer')
					}, function () {
						// change to any color that was previously used.
						$(this).css('stroke-width', '0px').css('cursor', 'default');
				});

			}	

					//console.log(attrs.ispdfclient);

				//.html not working in IE. So replacing it with text.
				if (!browser.getinfo()) {
					legend.append("text")
						.attr("class", "meetingTypeNonPDF wrapme")
						.attr("x", 24)
						.attr("y", 9)
						.attr("dy", ".35em")
						.attr("width", 190)
						.text(function (d) {
							var txtPercent;
							if (d.percent == '0.0') {
								txtPercent = '< 0.1';
							} else {
								txtPercent = d.percent;
							}
							return '  ' + txtPercent + '%   ' + d.id;
						});
					if (attrs.ispdfclient == 'true') {
						legend.append("text")
							.attr("class", "meetingTypePDF wrapme")
							.attr("x", 24)
							.attr("y", 9)
							.attr("dy", ".35em")
							.attr("width", 190)
							.text(function (d) {
								var txtPercent;
								if (d.percent == '0.0') {
									txtPercent = '< 0.1';
								} else {
									txtPercent = d.percent;
								}
								return '  ' + txtPercent + '%   ' + d.id + ' (' + format(d.meetingsCount) + ')';
							});
					}
				}
				else {
					if (attrs.ispdfclient == 'true') {
						legend.append("text")
							.attr("x", 24)
							.attr("y", 9)
							.attr("class", "meetingTypePDF wrapme")
							.attr("dy", ".35em")
							.attr("width", 190)
							.html(function (d) {

								var txtPercent;
								if (d.percent == '0.0') {
									txtPercent = '< 0.1';
								} else {
									txtPercent = d.percent;
								}

								if (4 - d.percent.length > 0) {
									return "&nbsp;&nbsp;" + txtPercent + "% &nbsp;&nbsp;&nbsp;" + d.id + "(" + format(d.meetingsCount) + ") </span>";
								}
								else {
									return "&nbsp;&nbsp;" + txtPercent + "% &nbsp;&nbsp;" + d.id + "(" + format(d.meetingsCount) + ")</span>";
								}
							});
					}

					legend.append("text")
						.attr("x", 24)
						.attr("y", 9)
						.attr("class", "meetingTypeNonPDF wrapme")
						.attr("dy", ".35em")
						.attr("width", 190)
						.html(function (d) {

							var txtPercent;
							if (d.percent == '0.0') {
								txtPercent = '< 0.1';
							} else {
								txtPercent = d.percent;
							}

							if (4 - d.percent.length > 0) {
								return "&nbsp;&nbsp;" + txtPercent + "% &nbsp;&nbsp;&nbsp;" + d.id + "</span>";
							}
							else {
								return "&nbsp;&nbsp;" + txtPercent + "% &nbsp;&nbsp;" + d.id + "</span>";
							}
						});
				}
				d3.selectAll('.wrapme').call(wrap);
                //fixed to adjust Meetings label in meeting type graph.
				var lang = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
	            if ( lang!= undefined && lang != '' && lang == 'de') {
				   $('#donutChartDiv > svg:nth-child(1) > g > text.bannerHeader.inside').css("font-size","17px"); 
				}
               
    		    	 // console.log((4-d.percent.length>0) ? '&nbsp;&nbsp;&nbsp;': '&nbsp;&nbsp;');
    		    	//  return "&nbsp;&nbsp;"+d.percent + "% "+ (4-d.percent.length>0) ? '&nbsp;&nbsp;&nbsp;': '&nbsp;&nbsp;' + d.id});
    		      /*.text(function(d) { 
    		         // return d.percent + " " + d.id; });
    		    	  
    		    	  return "   "+d.percent + "%   " + d.id; });*/


    		/*
    	
    		
    		var chart = c3.generate({
    		    data: {
    		        columns: scope.data,
    		        colors: {
    		        	Annual: '#00BCC6',
    		        	Special: '#0A6EC5',
    		        	Court: '#878ACC',
    		            AnnualSpecial : '#111111'
    		            	
    		        },
    		        format: d3.format('%'),
    		        type : 'donut',
    		        
    		        onclick: function (d, i) { console.log("onclick", d, i); },
    		        onmouseover: function (d, i) { console.log("onmouseover", d, i); },
    		        onmouseout: function (d, i) { console.log("onmouseout", d, i); }
    		    },
    		    legend: {
		            position: 'right',		            
		            item: {
		                onclick: function () {}
		            },
		            value: function (value, ratio, id) {
		                //var format = id === 'data1' ? d3.format(',') : d3.format('$');
		                //return format(value);
		            	
		            	return value + ' ' + ratio;
		            },
	    		    //format: d3.format('%')
		        },
    		    donut: {
    		        title: "Meetings :",
    		        label: {
    		            show: false
    		          }
    		    },
    		    tooltip: {
    		        format: {
    		            //title: function (d) { return 'Data ' + d; },
    		            value: function (value,ratio) {    		                
    		                return value + ' (' + (ratio * 100).toFixed(2) + '%)';
    		                
    		            }
//    		            value: d3.format(',') // apply this format to both y and y2
    		        }
    		    }
    		});
    		
    		
        	
    		
    		
    	*/});

		}
	}
});
vdsApp.directive('ngGeochart', function (browser, vdsServices) {

	return {
		restrict: 'EA',
		templateUrl: '/repo/app/js/directives/template/geoChart.html?version=' + vdsServices.getCSSJSVersion(),
		scope: {
			data: '=',
			colorsArr: '='
		},

		controller: function($scope) {

			$scope.ExpandButtonText = vdsServices.getPreferLanguageProperties().Expand;
			$scope.CollapseButtonText = vdsServices.getPreferLanguageProperties().Collapse;
			var getCustomOrCommonData = function(custom, common) {
				var CustomOrCommonData = '';
				if (custom != '' && custom != undefined) {
					CustomOrCommonData = custom;
				}
				else {
					CustomOrCommonData = common;
				}
				return CustomOrCommonData;
			};
			$scope.newExpandButtonFormat = getCustomOrCommonData(vdsServices.getCustomProperties().newExpandButtonFormat, vdsServices.getDashboardProperties().newExpandButtonFormat);

		},
		link: function (scope, element, attrs) {

			if (attrs.colorsarr != '') {
				colorCode = eval(attrs.colorsarr);
			}
			else {
				colorCode = ["#00BCC6", "#0A6EC5", "#878ACC", "#8DB9E2", "#8E999F", "#000000"];
			}

			var format = d3.format("0,000");
			var color = d3.scale.ordinal()
				.range(colorCode);

			
			  // added check for specific Label translation of Other legend in Meeting by market graph.
				for(i=0;i<scope.data.data.length;i++)
				{
					
					if( vdsServices.getPreferLanguageProperties()[scope.data.data[i].CountryName] != null && (scope.data.data[i].CountryName!="Other" || vdsServices.getPreferLanguageProperties().OtherCountryLabel== undefined) )
					{
						scope.data.data[i].CountryName = vdsServices.getPreferLanguageProperties()[scope.data.data[i].CountryName];
					}
          else if(scope.data.data[i].CountryName=="Other" && vdsServices.getPreferLanguageProperties().OtherCountryLabel!= undefined )
          {
            scope.data.data[i].CountryName = vdsServices.getPreferLanguageProperties().OtherCountryLabel;
          }
				}
				
				for(i=0;i<scope.data.legendData.length;i++)
				{
					
					if( vdsServices.getPreferLanguageProperties()[scope.data.legendData[i].CountryName] != null && (scope.data.legendData[i].CountryName!="Other" || vdsServices.getPreferLanguageProperties().OtherCountryLabel== undefined))
					{
						scope.data.legendData[i].CountryName = vdsServices.getPreferLanguageProperties()[scope.data.legendData[i].CountryName];
					}
          else if(scope.data.legendData[i].CountryName=="Other" && vdsServices.getPreferLanguageProperties().OtherCountryLabel!= undefined )
          {
            scope.data.legendData[i].CountryName = vdsServices.getPreferLanguageProperties().OtherCountryLabel;
          }
				}

			function graphSelectLoadMeeting(data, selection) {
				//showHideMeetingList(scope.$parent,"MeetingMarket_list","expandCollapseMarket_list",1);
				clearRemainingGraphselected(scope.$parent, "selectedMarketGraphList");
				scope.$parent.$apply(function() {
					scope.$parent.$parent.selectedMarketGraphList.name = data.getValue(selection[0].row, 3)
					scope.$parent.$parent.selectedMarketGraphList.clear = true;
				});
				var selectedOptions = data.getValue(selection[0].row, 3);
				if(selectedOptions)
				$('.messageCheckbox:checked').each(function() {
					selectedOptions = this.value;
				});
				var selArr = selectedOptions.split('||');
				var selLen = selArr.length;	//count total no of "selected" checkboxes in filter div
				var totalCheckboxes = $('.messageCheckbox').size(); //count no of checkboxes in filter div
				var vdsMeetingListURL = scope.$parent.$parent.actualUrl;

				if (selLen == totalCheckboxes - 1)	//if all checkboxes are selected, this means reset filter to be activated
				{
					selectedOptions = '';	//empty the options to force "reset filter"
				}
				//var meetingTypeStr = jQuery("#list").jqGrid('getGridParam', 'MeetingTypeList');
				var countryListStr = jQuery("#list").jqGrid('getGridParam', 'CountryList');
				//var votedListStr = jQuery("#list").jqGrid('getGridParam', 'VotedList');
				countryListStr = selectedOptions;
				$('#filterDropSearch').hide('500');
				jQuery('#list').jqGrid('setGridParam', { url: vdsMeetingListURL, page: 1, postData: { MeetingTypeList: '', CountryList: countryListStr, isInteractiveGraphCall: 1, VotedList: '',actionCode: 118,sessionToken:loggerHelperConfig.sessionToken }, MeetingTypeList: '', CountryList: countryListStr, VotedList: '' });
				jQuery("#list").trigger("reloadGrid");
				showHideMeetingListByCriteria(scope, "MeetingMarket_list", "expandCollapseMarket_list", 1);
				scope.$parent.$parent.updateMeetingListURLParameter(scope.$parent.$parent.meetingListTemplateUrl,'CountryList',countryListStr + "&isInteractiveGraphCall=1");
				scope.$parent.$parent.updateMeetingDetailURLParameter(scope.$parent.$parent.meetingDetailTemplateUrl,'CountryList',countryListStr);
			}


			function drawGeoChart(scope) {

				var data5 = new google.visualization.DataTable();
				data5.addColumn('number', 'Latitude');
				data5.addColumn('number', 'Longitude');
				data5.addColumn('number', 'CountryID');
				data5.addColumn('string', 'CountryName');
				data5.addColumn('number', 'ColorCode');
				data5.addColumn('number', 'MeetingCount');
				data5.addColumn({ 'type': 'string', 'lable': 'Sentence', 'role': 'tooltip', 'p': { 'html': true } });


				scope.InteractiveGraphs = vdsServices.getPreference().InteractiveGraphs;

				var options = {
					tooltip: { trigger: 'focus', textStyle: { fontName: attrs.tooltipfontname, fontSize: attrs.tooltipfontsize }, isHtml: true, showTitle: false },
					sizeAxis: { minValue: 0, maxValue: scope.data.totalMeetings },
					magnifyingGlass: { enable: true, zoomFactor: 5.0 },
					legend: 'none',
					enableRegionInteractivity: 'false',
					keepAspectRatio: 'true',
					//	height: 400,
					displayMode: 'markers',
					width: '100%',
					backgroundColor: attrs.backgroundcolor,
					height: '100%',
					//backgroundColor: {fill : '#F9F9F9', strokeWidth : 1},
					//backgroundColor.strokeWidth
					//datalessRegionColor: '#dddddd' ,
					datalessRegionColor: '#ffffff',
					colorAxis: { colors: colorCode, values: [1, 2, 3, 4, 5, 6] },
					//   isStacked: true 

				};


				var view5 = new google.visualization.DataView(data5);
				view5.hideColumns([2]);
				

		
				angular.forEach(scope.data.data, function (value) {
				
					data5.addRows([[parseInt(value.Latitude), parseInt(value.Longitude), parseInt(value.CountryId), value.CountryName, value.ColorCode, parseInt(value.MeetingCount), value.CountryName + ' | '.concat(format(value.MeetingCount)) + (value.MeetingCount > 1 ? vdsServices.getPreferLanguageProperties().MeetingsLabel : vdsServices.getPreferLanguageProperties().MeetingLabel)]]);
				});
				var chart = new google.visualization.GeoChart(document.getElementById('geoChartDiv'));
				google.visualization.events.addListener(chart, 'ready', function () {
				if(scope.InteractiveGraphs == true)
				{
				document.getElementById('geoChartDiv').addEventListener('mouseover',onmouseoverHandler);
				google.visualization.events.addListener(chart, 'select', function() {
					chartObject = chart;

					var selection = chartObject.getSelection();
					if (selection.length) {
						graphSelectLoadMeeting(data5, selection);
						$('.selectedMarketGraphList').css('display', 'block');

					}
					else {
						// do something if the user deselects a point
						//  alert('deselected');
						//  showHideMeetingList(scope.$parent,"MeetingMarket_list","expandCollapseMarket_list",1);
						//  scope.$parent.$parent.getMeetingList();
						// jQuery('#list').jqGrid('setGridParam', {page : 1,postData : {MeetingTypeList: '',CountryList: '',VotedList : '' }, MeetingTypeList: '',CountryList: '',VotedList : ''});						
						// jQuery("#list").trigger("reloadGrid");
						// $("#meetingDisplayGrid").show('500');
					}

				});
			}
		});
				chart.draw(view5, options);
				
					
					
					

					//location.href = 'http://www.google.com?row=' + row + '&col=' + col + '&year=' + year;
				
				
			}
			function onmouseoverHandler() {
				$("#geoChartDiv g circle").hover(function() {
					$(this).css('cursor', 'pointer')
				  });
			}
			drawGeoChart(scope);
			setTimeout(function() {
				$('#geoChartDiv').html('');
				$('#geoChartDiv').parent().width('100%');
				var widthSvg = $('#geoChartLegend svg')[0].getBBox().width;
				$('#geoChartLegend').width(widthSvg);
				drawGeoChart(scope);
			}, 500);

			var legend = d3.select("#geoChartLegend").append("svg")
				.attr("class", "legend")
				.attr("width", "100%")
				.attr("height", "100%")
				.attr("viewbox", "0 1 150 185")
				.attr("preserveAspectRatio", "xMinYMin meet")
				.selectAll("g")
				.data(scope.data.legendData)
				.enter().append("g")
				.attr("transform", function(d, i) {
					return "translate(0," + i * 35 + ")";
				});

			var rect = legend.append("rect")
				.attr("width", 18)
				.attr("height", 18)
				.attr("class", "rectangle")
				.attr("name", function(d)  //for dynamic filtering
				{
					return d.CountryName;
				})
				.style("fill", function(d) {
					return color(d.ColorCode);
				});
			if(scope.InteractiveGraphs == true)
			{
			legend.on("click", function(d, i) {
				var selectedOptions = d.CountryName;
        // find and fetch english key for translated country legend.
        var OptionsKey = Object.keys(vdsServices.getPreferLanguageProperties()).filter(function (key) {
         return vdsServices.getPreferLanguageProperties()[key] === d.CountryName })[0];

        if(OptionsKey!=null && OptionsKey!=undefined){
          if(OptionsKey!="OtherCountryLabel"){
             selectedOptions=OptionsKey;
          }else{
            selectedOptions="Other";
          }            
        }
				if (selectedOptions == 'Other') {
					selectedOptions = '';
					var ids = jQuery("#list").jqGrid('getDataIDs');
					var rowData = jQuery('#list').jqGrid('getRowData', ids[0])
					rowData.CountryList = $.trim(rowData.CountryList).replace(/[\n\r]+/g, ' ');
					filterData = $.trim(rowData.CountryList).split(' || ');
					filterData.sort();
					var finalArray = new Array();
					var legendArray = new Array();
					for (a in scope.data.legendData) {
						legendArray.push(scope.data.legendData[a].CountryName);
					}
					for (a in filterData) {
						if (jQuery.inArray(filterData[a], legendArray) == -1) {
							if (selectedOptions == '') {
								selectedOptions = filterData[a];
							}
							else {
								selectedOptions += '||' + filterData[a];
							}
						}

					}
				}
				var vdsMeetingListURL = scope.$parent.$parent.actualUrl;

				$('.messageCheckbox:checked').each(function() {
					selectedOptions = selectedOptions;
				});

				var selArr = selectedOptions.split('||');
				var selLen = selArr.length;	//count total no of "selected" checkboxes in filter div
				var totalCheckboxes = $('.messageCheckbox').size(); //count no of checkboxes in filter div


				if (selLen == totalCheckboxes - 1)	//if all checkboxes are selected, this means reset filter to be activated
				{
					selectedOptions = '';	//empty the options to force "reset filter"
				}
				var countryListStr = jQuery("#list").jqGrid('getGridParam', 'CountryList');
				countryListStr = selectedOptions;
				//showHideMeetingList(scope.$parent,"MeetingMarket_list","expandCollapseMarket_list",1);
				clearRemainingGraphselected(scope.$parent, "selectedMarketGraphList");
				scope.$parent.$apply(function() {
					scope.$parent.$parent.selectedMarketGraphList.name = d.CountryName;
					scope.$parent.$parent.selectedMarketGraphList.clear = true;
				});
				//scope.$parent.$parent.getMeetingList(section);
				$('#filterDropSearch').hide('500');
				jQuery('#list').jqGrid('setGridParam', { url: vdsMeetingListURL, page: 1, postData: { MeetingTypeList: '', CountryList: countryListStr, isInteractiveGraphCall: 1, VotedList: '',actionCode: 118,sessionToken:loggerHelperConfig.sessionToken }, MeetingTypeList: '', CountryList: countryListStr, VotedList: '' });
				jQuery("#list").trigger("reloadGrid");
				showHideMeetingListByCriteria(scope, "MeetingMarket_list", "expandCollapseMarket_list", 1);
				//var x = '2px solid';
				//$('.selectedMarketGraphList').css('border', x).css('height', '44px');
				//$('.selectedMarketGraphList').css('color', colorCode[d.ColorCode - 1]);
				//$('.bannerHeaderGraph').css('color', colorCode[d.ColorCode - 1]);
				$('.selectedMarketGraphList').css('display','block');
				scope.$parent.$parent.updateMeetingListURLParameter(scope.$parent.$parent.meetingListTemplateUrl,'CountryList',countryListStr + "&isInteractiveGraphCall=1");
				scope.$parent.$parent.updateMeetingDetailURLParameter(scope.$parent.$parent.meetingDetailTemplateUrl,'CountryList',countryListStr);
			});
			$("#geoChartLegend rect.rectangle").hover(function() {
				$(this).css('stroke', 'rgb(255, 255, 255)').css('stroke-width', '4px').css('cursor', 'pointer')
			}, function () {
				// change to any color that was previously used.
				$(this).css('stroke-width', '0px').css('cursor', 'default');
			});
			}
			//.html not working in IE. So replacing it with text.
			if (!browser.getinfo()) {
				legend.append("text")
					.attr("class", "marketNonPDF")
					.attr("x", 24)
					.attr("y", 9)
					.attr("dy", ".35em")
					.text(function (d) {

						return '  ' + d.percent + '%   ' + d.CountryName;
					});
				if (attrs.ispdfclient  == 'true') {
					legend.append("text")
						.attr("class", "marketPDF")
						.attr("x", 24)
						.attr("y", 9)
						.attr("dy", ".35em")
						.text(function (d) {

							return '  ' + d.percent + '%   ' + d.CountryName + ' (' + format(d.MeetinNum) + ')';
						});
				}
			}
			else {
				//	  console.log(attrs);
				if (attrs.ispdfclient  == 'true') {
					legend.append("text")
						.attr("class", "marketPDF")
						.attr("x", 24)
						.attr("y", 9)
						.attr("dy", ".35em")
						.html(function (d) {


							if (4 - d.percent.length > 0) {
								return "&nbsp;&nbsp;" + d.percent + "% &nbsp;&nbsp;&nbsp;" + d.CountryName + "(" + format(d.MeetinNum) + ")";
							}
							else {
								return "&nbsp;&nbsp;" + d.percent + "% &nbsp;&nbsp;" + d.CountryName + "(" + format(d.MeetinNum) + ")";
							}


						});
				}

				legend.append("text")
					.attr("class", "marketNonPDF")
					.attr("x", 24)
					.attr("y", 9)
					.attr("dy", ".35em")
					.html(function (d) {




						if (4 - d.percent.length > 0) {
							return "&nbsp;&nbsp;" + d.percent + "% &nbsp;&nbsp;&nbsp;" + d.CountryName;
						}
						else {
							return "&nbsp;&nbsp;" + d.percent + "% &nbsp;&nbsp;" + d.CountryName;
						}

					});
			}

			$(window).resize(function () {
				$('#geoChartDiv').html('');
				$('#geoChartDiv').parent().width('100%');
				var widthSvg = $('#geoChartLegend svg')[0].getBBox().width;;
				$('#geoChartLegend').width(widthSvg);
				drawGeoChart(scope);
				scope.$apply();
			});




			/*  legend.append("text")
				  .attr("x", 24)
				  .attr("y", 9)
				  .attr("dy", ".35em")
				  //.html not working in IE. So replacing it with text.
				  .html(function(d) { 
					  if(4-d.percent.length>0)
						  {
						  return "&nbsp;&nbsp;"+d.percent + "% &nbsp;&nbsp;&nbsp;" + d.id;
						  }
					  else
						  {
						  return "&nbsp;&nbsp;"+d.percent + "% &nbsp;&nbsp;" + d.id;
						  }
						});
				  .text(function(d) { 
					  
						  return '  '+d.percent + '%   ' + d.CountryName;
						});*/




		}
	}
});

vdsApp.directive('ngHeatmap', function (vdsServices) {

	return {
		restrict: 'EA',
		templateUrl: '/repo/app/js/directives/template/heatmap.html?version=' + vdsServices.getCSSJSVersion(),
		scope: {
			data: '=',
			colorsArr: '=',
			singleColor: '='
		},

		controller: function($scope, vdsServices) {

			this.selectedElement = function(item) {//This function can be accessed by child or sibling controllers.
				//This function will not be accessible from directive's template as it is not defined on scope.

				$scope.selectednode = vdsServices.getHeatMapSelected();
			};

		},
		link: function(scope, element, attrs) {
			scope.$watch('data', function() {
				/*$(function(){*/
				var ua = window.navigator.userAgent;
				var msie = ua.indexOf("MSIE ");
				
			
				
				for(i=0;i<scope.data.data.children.length;i++)
				{
					
					if( vdsServices.getPreferLanguageProperties()[scope.data.data.children[i].id] != null)
					{
						scope.data.data.children[i].id = vdsServices.getPreferLanguageProperties()[scope.data.data.children[i].id];
					}
				}

				
				function detectIE() {
					var ua = window.navigator.userAgent;

					var msie = ua.indexOf('MSIE ');
					if (msie > 0) {
						// IE 10 or older => return version number
						return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
					}

					var trident = ua.indexOf('Trident/');
					if (trident > 0) {
						// IE 11 => return version number
						var rv = ua.indexOf('rv:');
						return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
					}

					var edge = ua.indexOf('Edge/');
					if (edge > 0) {
					   // Edge (IE 12+) => return version number
					   return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
					}

					// other browser
					return false;
				}

				var whichIE = detectIE();

		

    		function heatMapDraw() {
    		d3.select("#heatmap_chartDiv").html("");
    		width = ($('.container').width() -40) * 0.99;
			if(width<630)
				width = 630;
			
			var colorArr = new Array();	
			if(attrs.colorsarr != '')
			{
				colorsArr = eval(attrs.colorsarr);
				if(colorsArr.length == 10)	//if ten colors are found 
				{					
					colorsArr.unshift(colorsArr[0]);
					//console.log(colorsArr.length+'=>'+colorsArr[0]+"=>"+colorsArr);
				}				
			}
			else
			{
				colorsArr = ["#DAEDEA", "#CFEBEC", "#C2E8EA", "#BFE4DE", "#B6E5E8", "#AAE2E5", "#9EE0E3", "#92DDE1", "#85DADF", "#79D7DC", "#61D2D8"];
			}
			
			
			if(attrs.singlecolor != '')
			{				
				var singleColor = attrs.singlecolor;
			}
			else
			{
				var singleColor = '#61D2D8';
			}
			
			var margin = { top: 30, right: 20, bottom: 0, left: 0 },
			    width = width - margin.left - margin.right,
			    height = 400 - margin.top - margin.bottom,
			  //  color = d3.scale.category20c(),
			    //@TODO : get the min and max values form the percentage range in dataset to see better color difference in the heatmap.
			  //  colorDomain = [0,1.9,3.4,3.5,4.2,5.8,9.1,9.9,10.3,12.7,38.5],
			    colorDomain = scope.data.domain,
			    colorRange = colorsArr,
			  //  colorRange = ["#DAEDEE", "#61D2D8"],
			    div = d3.select("#heatmap_chartDiv").append("div")
			    .style("position", "relative")
			    //.style("width", (width + margin.left + margin.right) + "px")
			    //.style("height", (height + margin.top + margin.bottom) + "px")
				.style("width","100%")
				.style("height","100%")
			    .style("left", margin.left + "px")
			    .style("top", margin.top + "px");
    	

			var color = d3.scale.linear()
			  .domain(colorDomain)
			  .range(colorRange);

					var treemap = d3.layout.treemap()
						.size([width, height])
						.sticky(true)
						.sort(function(a, b) { return a.percent - b.percent; })
						.value(function(d) {
							//console.log(d.value);
							return d.value;
						});

					//console.log(JSON.stringify(scope.data.data));

					heatSelected = false;
					var heatSelectedName = '';

					var node = div.datum(scope.data.data).selectAll(".node")
						.data(treemap.nodes)
						.enter().append("div")
						.attr("sectorId", function(d) {
							return d.sectorId;
						})
						.attr("class", "node")
						.attr("tooltipTxt", function(d) {
							return d.percent + '% | ' + d.id + ' | ' + formatNumber(d.meetingCount) + (d.meetingCount > 1 ? vdsServices.getPreferLanguageProperties().MeetingsLabel : vdsServices.getPreferLanguageProperties().MeetingLabel);
						})

						.call(position)
						/*   .style("fill", function(d) { 
					    
							return color(d.value)})
						*/
						.style("background-color", function(d) {
							//   return colourFunction(d);
							//  return colourInterpolator( colourScale( d.area ) );
							if (d.percent === '100.0') {
								return d.name == 'tree' ? singleColor : singleColor;
							}
							else {
								return d.name == 'tree' ? singleColor : color(d.percent);
							}

			})
    	  //  .append('div')
    	   /* .style("font-size", function (d) {
    	    // compute font size based on sqrt(area)
    	    return Math.max(12, 0.05 * Math.sqrt(d.area)) + 'px';
			})*/
    	   /*.style("padding-top", function (d) {
    	    // compute font size based on sqrt(area)
    		   
    		//   var blockHeight = d3.select(this).node().getBoundingClientRect().height.toFixed(0);
    		 //  console.log("block Height :" + blockHeight + " id : " + d.id + " area : " + d.area + " sq : " + Math.sqrt(d.area) );
    		//   console.log(Math.max(45, 0.20 * Math.sqrt(d.area)));
    		//   return   Math.max(45, 0.20 * Math.sqrt(d.area)) > 20 ? ((d.dy - 20) - Math.max(45, 0.25 * Math.sqrt(d.area))) + 'px' : (blockHeight - 45) + 'px';
    	  //  return   Math.max(20, 0.20 * Math.sqrt(d.area)) > 20 ? ((d.dy - 20) - Math.max(14, 0.20 * Math.sqrt(d.area))) + 'px' : 45 + 'px';
    		   
    		   return Math.max(45, 0.20 * Math.sqrt(d.area)) > 20 ? ((d.dy - 20) - Math.max(45, 0.25 * Math.sqrt(d.area))) + 'px' : 20 + 'px';
			})*/
    	    
			.html(function (d) {    	    
    		//var shortName = d.value < 2 ? (d.id ? d.id.substring(0, 4) : "") + "..." : d.id;    		
			
				var blockHeight = d3.select(this).node().getBoundingClientRect().height.toFixed(0);
				var blockWidth = d3.select(this).node().getBoundingClientRect().width.toFixed(0);
				
				//d3.select(this).node().parentNode.style.paddingTop = (blockHeight - 45) < 0 ?  blockHeight/3 : (blockHeight - 45);
				
				//console.log(d.id + ' ' + blockWidth + ' ' + blockHeight);
				// return d.children ? null : (d.id == 'Other'?'' : '<img style="height :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px" src="app/img/heatmap_icons/'+ d.img +'"/> ') + '<div>' + (d.absolute ? '<' : '') + d.value+'% <br/>'+ shortName + '</div>';
				 //return d.children ? null : '<table><tr><td><img style="height : 40 px" src="app/img/heatmap_icons/'+ d.img +'"/> ' + '</td><td>&nbsp;</td><td>' + (d.absolute ? '<' : '') + d.value+'% <br/>'+ shortName + '</td></tr></table>';
				//return d.children ? null : '<table><tr><td><span class="icon" data-icon="'+ d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td>' + d.percent+'% <br/>'+ d.id + '</td></tr></table>';
				//return d.children ? null : (blockHeight > 65 && blockWidth > 100) ? '<table style=margin-top : "' +  ((blockHeight - 45) < 0 ?  blockHeight/3 : (blockHeight - 45)) +'px;"><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : 16px;">' + d.percent+'% </span><br/><span style="font-size : 12px;">'+ d.id + '</span></td></tr></table>' :
    		
				/*
				return d.children ? null : (blockHeight > 75 && blockWidth > 130) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span><br/><span style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px">'+ d.id + '</span></td></tr></table>': (blockHeight > 65 && blockWidth > 100) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.15 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.08 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span><br/><span style="font-size : '+ Math.max(10, 0.04 * Math.sqrt(d.area))  +'px">'+ d.id + '</span></td></tr></table>' :
						(blockHeight < 40 || blockWidth < 60) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.15 * Math.sqrt(d.area))  +'px"></span></td><tr><tr><td><span style="font-size : '+ Math.max(10, 0.04 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span></td></tr><table>' :
						'<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.15 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle"><span style="font-size : '+ Math.max(10, 0.04 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span></td></tr></table>'; */
						
				/*
				// before ellipsis	
				return d.children ? null : (blockHeight > 65 && blockWidth > 100) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span><br/><span style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px">'+ d.id + '</span></td></tr></table>' :
    				(blockHeight < 40 || blockWidth < 50) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(10, 0.20 * Math.sqrt(d.area))  +'px"></span></td><tr><tr><td><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span></td></tr><table>' :
    				'<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span></td></tr></table>';	

				*/	
				//  text-overflow: ellipsis !important; overflow: hidden; white-space: nowrap;width: '+divnodewidth1+'px"
				// after ellipsis
				var divnodewidth1 = (blockWidth * 78 / 100);	//set 80% of div width
				var divnodewidth2 = (blockWidth * 62 / 100)-1;	//set 62% of div width				
				var divnodewidth3 = (blockWidth * 68 / 100);	//set 68% of div width
				var divnodewidth4 = (blockWidth * 59 / 100);	//set 59% of div width
				var divnodewidth5 = (blockWidth * 56 / 100);	//set 56% of div width
				
				
				var SectorWordLengthLimit = 8;
				scope.InteractiveGraphs = vdsServices.getPreference().InteractiveGraphs;
				if(d.id != undefined)
				{
					var sectorNameArr = new Array();
					sectorNameArr = d.id.split(" ");
					var isSectorWordLengthLong = false;
					
					var sectorWordMaxLength = 0;
					if(sectorNameArr.length > 1)
					{
						//console.log('1=>'+sectorNameArr[0].length+'=>'+sectorNameArr[1].length);
						if(sectorNameArr[0].length > SectorWordLengthLimit || sectorNameArr[1].length > SectorWordLengthLimit)						
						{
							isSectorWordLengthLong = true;
						}
						else
						{
							isSectorWordLengthLong = false;
						}
						
												
						if(sectorNameArr[0].length >= sectorNameArr[1].length)
						{
							sectorWordMaxLength = sectorNameArr[0].length;
						}
						else
						{
							sectorWordMaxLength = sectorNameArr[1].length;
						}
							
					}
					else
					{						
						//console.log('2=>'+sectorNameArr[0].length);	
						if(sectorNameArr[0].length > SectorWordLengthLimit)
						{
							isSectorWordLengthLong = true;
						}
						else
						{
							isSectorWordLengthLong = false;
						}

						
						sectorWordMaxLength = sectorNameArr[0].length;	
					}	
				}
				
				//250 width: '+divnodewidth1+'px";
														
					return d.children ? null : (blockHeight > 65 && blockWidth > 190) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; "; ">'+ d.id + '</div></td></tr></table>' : 
				 (blockHeight > 65 && blockWidth > 170 && (( whichIE > 0 && sectorWordMaxLength > 12) || sectorWordMaxLength > 13)) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;word-wrap: break-word;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; overflow: hidden; width: '+divnodewidth3+'px">'+ d.id + '</div></td></tr></table>' :
				 
				 (blockHeight > 65 && blockWidth > 170) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; ">'+ d.id + '</div></td></tr></table>' :
				
				(blockHeight > 85 && blockWidth > 140 && sectorWordMaxLength > 10) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;word-wrap: break-word;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; overflow: hidden; width: '+divnodewidth4+'px">'+ d.id + '</div></td></tr></table>' :
				
				(blockHeight > 85 && blockWidth > 140) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; ">'+ d.id + '</div></td></tr></table>' :
				
				(blockHeight > 65 && blockWidth > 100 && blockWidth < 110 &&  sectorWordMaxLength > 7) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle" style="line-height: 1.3;word-wrap: break-word;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; overflow: hidden; width: '+divnodewidth2+'px">'+ d.id + '</div></td></tr></table>' :
				
				(blockHeight > 65 && blockWidth > 100 && isSectorWordLengthLong == false) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; ">'+ d.id + '</div></td></tr></table>' :
				
				(blockHeight > 65 && blockWidth > 100) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3;word-wrap: break-word;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; overflow: hidden; width: '+divnodewidth2+'px">'+ d.id + '</div></td></tr></table>' :
				
    				(blockHeight < 30 && blockHeight > 25 && blockWidth > 60) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(10, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="display: none; ">(' + d.meetingCount + ')</span></span></td></tr><table>' : 
					
					(blockHeight < 30 || blockWidth < 30) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(10, 0.20 * Math.sqrt(d.area))  +'px"></span></td><tr><tr><td><span style="display: none; font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="display: none; ">(' + d.meetingCount + ')</span></span></td></tr><table>' : 
					
					(blockHeight < 40 || blockWidth < 60) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(10, 0.20 * Math.sqrt(d.area))  +'px"></span></td><tr><tr><td><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span></td></tr><table>' :
				
				(blockHeight > 65 && blockWidth > 85  && sectorWordMaxLength <= 6) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px;">'+ d.id + '</div></td></tr></table>' :
				
				
				(blockHeight > 65 && blockWidth > 70  && sectorWordMaxLength <= 5) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px;">'+ d.id + '</div></td></tr></table>' : 
								
				
				/*
				(blockHeight > 65 && blockWidth > 70  && sectorNameArr[0].length > 5) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle" style="line-height: 1.3;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span><div style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px; text-overflow: ellipsis !important; overflow: hidden; white-space: nowrap; width: '+divnodewidth4+'px">'+ d.id + '</div></td></tr></table>' :
				*/
				
				(blockWidth < 80 && blockWidth > 60 && blockHeight > 80) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td></tr><tr><td class="fontStyle"><div style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px; text-overflow: ellipsis !important; overflow: hidden; white-space: nowrap; width: '+divnodewidth2+'px">' + d.percent+'% </div><span class="sectorCount" style="">(' + d.meetingCount + ')</span></td></tr></table>' :
				
    				'<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px; text-overflow: ellipsis !important; overflow: hidden; white-space: nowrap; width: '+divnodewidth2+'px">' + d.percent+'% <span class="sectorCount" style="">(' + d.meetingCount + ')</span></span></td></tr></table>';

				
				


							/*return d.children ? null : (blockHeight > 75 && blockWidth > 130) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.20 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;&nbsp;</td><td class="fontStyle" style="line-height: 1.3; word-wrap: normal; word-break: break-word; -ms-word-wrap: normal; word-break: break-word; -webkit-hyphens: auto; -moz-hyphens: auto; -ms-hyphens: auto; hyphens: auto;"><span style="font-size : '+ Math.max(12, 0.1 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span><br/><span style="font-size : '+ Math.max(12, 0.07 * Math.sqrt(d.area))  +'px">'+ d.id + '</span></td></tr></table>': (blockHeight > 65 && blockWidth > 100) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.15 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle" style="line-height: 1.3; word-wrap: normal; word-break: break-word; -ms-word-wrap: normal; word-break: break-word; -webkit-hyphens: auto; -moz-hyphens: auto; -ms-hyphens: auto; hyphens: auto;"><span style="font-size : '+ Math.max(12, 0.08 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span><br/><span style="font-size : '+ Math.max(10, 0.04 * Math.sqrt(d.area))  +'px">'+ d.id + '</span></td></tr></table>' :
									(blockHeight < 40 || blockWidth < 60) ? '<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.15 * Math.sqrt(d.area))  +'px"></span></td><tr><tr><td><span style="font-size : '+ Math.max(10, 0.04 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span></td></tr><table>' :
									'<table><tr><td><span class="icon ' + d.img +'" style="font-size :'+ Math.max(20, 0.15 * Math.sqrt(d.area))  +'px"></span></td><td>&nbsp;</td><td class="fontStyle"><span style="font-size : '+ Math.max(10, 0.04 * Math.sqrt(d.area))  +'px">' + d.percent+'% </span></td></tr></table>'; */

						})



						.on("mousemove", function(d) {


							var objOffset = $('#heatmap_chartDiv').offset();
							var positionoBj = objOffset.left;
							var xPosition = d3.event.pageX - objOffset.left - 110;
							var yPosition = d3.event.pageY - objOffset.top - 70;
							var element = d3.select('.node').node();
							//console.log(d3.select(this).attr('tooltiptxt') + '=>' +d3.select(this).node().style.width);

							if (msie > 0) {      // If Internet Explorer, return version number
								xPosition = xPosition - 25;
							}
							// For Iframe solution 
							if (xPosition < 0)
								xPosition = 0;
							var widthNode = $('#heatmap_chartDiv div.node:first').width();
							var totWidth = $('#heatmap_tooltip').width() + xPosition;
							if (totWidth >= (widthNode - 100)) {
								xPosition = widthNode - $('#heatmap_tooltip').width();
							}
							// For Iframe solution ends
							var blockHeight = d3.select(this).node().style.height;
							blockHeight = blockHeight.replace('px', '')
							var blockWidth = d3.select(this).node().style.width;
							blockWidth = blockWidth.replace('px', '')
							if (blockHeight < 40 || blockWidth < 60) {
								var tooltipTxt = d3.select(this).attr('tooltipTxt');
							}
							else {
								var tooltipTxt = d.id + ' | ' + formatNumber(d.meetingCount) + (d.meetingCount > 1 ? vdsServices.getPreferLanguageProperties().MeetingsLabel : vdsServices.getPreferLanguageProperties().MeetingLabel);
							}

							d3.select("#heatmap_tooltip")
								.style("left", xPosition + "px")
								.style("top", yPosition + "px")
								.style("height", "42px");
							d3.select("#heatmap_tooltip #heading")
								//   .text((d.absolute ? '<' : '') + d.value + "% " + d.id);    	    
								.text(tooltipTxt);

							d3.select("#heatmap_tooltip").classed("hidden", false);
							d3.select("#heatmap_tooltip").classed("hidden", false).style("z-index", 999);
							if(scope.InteractiveGraphs == true)
							{
							d3.select(this).style("box-shadow", "0 0 10px navy").style("z-index", 999).style("cursor", "pointer");
							}
							else{
								d3.select(this).style("cursor", "default");
							}
						})
						.on("mouseout", function() {
							d3.select("#heatmap_tooltip").classed("hidden", true);
							d3.select("#heatmap_tooltip").classed("hidden", true).style("z-index", 0);
							d3.select(this).style("box-shadow", "none").style("z-index", 0).style("cursor", "default");
						})
						.on("mouseover", function(d) {

							var objOffset = $('#heatmap_chartDiv').offset();
							var positionoBj = objOffset.left;
							var xPosition = d3.event.pageX - objOffset.left - 110;
							var yPosition = d3.event.pageY - objOffset.top - 70;
							if (msie > 0) {      // If Internet Explorer, return version number
								xPosition = xPosition - 25;
							}
							// For Iframe solution 
							if (xPosition < 0)
								xPosition = 0;
							var widthNode = $('#heatmap_chartDiv div.node:first').width();
							var totWidth = $('#heatmap_tooltip').width() + xPosition;
							if (totWidth >= (widthNode - 100)) {
								xPosition = widthNode - $('#heatmap_tooltip').width();
							}
							// For Iframe solution ends

							d3.select("#heatmap_tooltip")
								.style("left", xPosition + "px")
								.style("top", yPosition + "px")
								.style("height", "42px");
							d3.select("#heatmap_tooltip #heading")
								//   .text((d.absolute ? '<' : '') + d.value + "% " + d.id);
								.text(d.id + ' | ' + d.meetingCount + ' Meetings');
							d3.select("#heatmap_tooltip").classed("hidden", false);
							if(scope.InteractiveGraphs == true)
							{
							d3.select(this).style("box-shadow", "0 0 10px navy").style("z-index", 999).style("cursor", "pointer");
							}
						})
						if(scope.InteractiveGraphs == true)
						{
						node.on("click", function(d, i) {
							showHideMeetingList(scope.$parent, "MeetingSector_list", "expandCollapseSector_list", 1);
							clearRemainingGraphselected(scope.$parent, "selectedSectorGraphList");
							scope.$apply(function() {
								scope.$parent.$parent.selectedSectorGraphList.name = d.id;
								scope.$parent.$parent.selectedSectorGraphList.clear = true;
							});
							$('.selectedSectorGraphList').css('display','block');
							var map = [{ key: 'sectorId', value: d.sectorId },{key: 'isInteractiveGraphCall', value: 1}];
							scope.$parent.$parent.getMeetingList(map);												
							$("#meetingDisplayGrid").show('500');
							var change = document.getElementById("expandCollapseSector_list");
							$("#" + "MeetingSector_list" + "_header").css("display", "block");
							//change.innerHTML = "<span class='glyphicon glyphicon-minus'></span> " + vdsServices.getPreferLanguageProperties().Collapse + "";
							d3.event.stopPropagation();
						});
					}

				}


				heatMapDraw();


				$(window).resize(function() {
					heatMapDraw();
				});

		function formatNumber(number)
		{
			number = number + '';
			x = number.split('.');
			x1 = x[0];
			x2 = x.length > 1 ? '.' + x[1] : '';
			var rgx = /(\d+)(\d{3})/;
			while (rgx.test(x1)) {
				x1 = x1.replace(rgx, '$1' + ',' + '$2');
			}
			return x1 + x2;
		}
	
    	function position() {
    	    this.style("left", function (d) {
    	        return d.x + "px";
    	    })
    	        .style("top", function (d) {
    	        return d.y + "px";
    	    })
    	        .style("width", function (d) {
    			return  d.dx + "px";
    	    })
    	        .style("height", function (d) {
    			return  d.dy + "px";
    	       // return d.percent<1 ? 40 + "px" : Math.max(0, d.dy - 1) + "px";
    	    })
    	     	.style("padding-top", function (d) {
    	     		var blockHeight =  d.dy;
    	     		//var blockWidth = Math.max(20, d.dx - 1);
    	     		//return 20 +'px';
    	     		
    	     	return blockHeight > 75 ? 15 + 'px' : blockHeight < 40 ? 3 + 'px' : 6 + 'px';
    	     })
    	     	.style("padding-left", function (d) {
    	     		//var blockHeight = Math.max(20, d.dy - 1);
    	     		var blockWidth = d.dx;
    	     		//return 20 +'px';
    	     	return  blockWidth > 140 ? 15 + 'px' : blockWidth < 60 ? 3 + 'px' :  6 + 'px';
    	     	//return 20 + 'px' ;
    	     });
    	   /* 	.style("padding-top", function (d) {
    			return Math.max(20, d.dy - 1) > 65 ?  (Math.max(20, d.dy - 1) - 65) + 'px' : 10 + 'px' ;
    	       // return d.percent<1 ? 40 + "px" : Math.max(0, d.dy - 1) + "px";
    	    })*/
    	   /* .style("padding-left", function (d) {
    			return Math.max(20, d.dx - 1) > 100 ?  20 + 'px' : 10 + 'px' ;
    	       // return d.percent<1 ? 40 + "px" : Math.max(0, d.dy - 1) + "px";
    	    });*/
    	}
    	
    	});
    	/*});
    	*/
    }
  }
});

// VDS-990: 'Votes Cast by Proposal Category' graph helper function - [START]
var votesCastByProposalCategoryGraph = {
  shareholder: {
    attrs: null,
    ajScope: null,
    hAxisTick: null,
    chartData: null,
    getColors: function () {
      var _this = votesCastByProposalCategoryGraph;
      return [_this.shareholder.attrs.colors];
    },
    onmouseoverHandler: function () {
      var graphSubType = votesCastByProposalCategoryGraph.shareholder;
      document.getElementById(graphSubType.attrs.id).style.cursor = "pointer";
    },
    onmouseoutHandler: function () {
      var graphSubType = votesCastByProposalCategoryGraph.shareholder;
      document.getElementById(graphSubType.attrs.id).style.cursor = "default";
    },
  },
  management: {
    attrs: null,
    ajScope: null,
    hAxisTick: null,
    chartData: null,
    getColors: function () {
      var _this = votesCastByProposalCategoryGraph;
      return [_this.management.attrs.colors];
    },
    onmouseoverHandler: function () {
      var graphSubType = votesCastByProposalCategoryGraph.management;
      document.getElementById(graphSubType.attrs.id).style.cursor = "pointer";
    },
    onmouseoutHandler: function () {
      var graphSubType = votesCastByProposalCategoryGraph.management;
      document.getElementById(graphSubType.attrs.id).style.cursor = "default";
    },
  },
  vdsServices: null,
  chartDivWidth: "100%",
  chartDivHeight: "60%",
  chartInnerWidth: "100%",
  chartInnerHeight: "90%",
  chartSlantedTextAngle: 45,
  getDefaultTicks: function () {
    var ticks = [];
    for (var i = 0; i < 6; ++i) {
      var j = 2 * i;
      ticks[i] = { v: j, f: j };
    }
    return ticks;
  },
  updateVAxisFontSize: function (chartDataLength, options) {
    if (
      typeof options === "undefined" ||
      options === null ||
      chartDataLength < 11
    ) {
      return;
    }
    try {
      var vAxisFontSize =
        parseInt(options.vAxis.textStyle.fontSize);
      if (vAxisFontSize > 14) {
        options.vAxis.textStyle.fontSize = 14;
      } else if (vAxisFontSize < 11) {
        options.vAxis.textStyle.fontSize = 11;
      } else {
        options.vAxis.textStyle.fontSize = vAxisFontSize;
      }
    } catch (err) {
      console.error(err);
    }
  },
  getOptions: function (type) {
    var _this = votesCastByProposalCategoryGraph;
    var graphSubType = votesCastByProposalCategoryGraph[type];
    var hAxisTick = graphSubType.hAxisTick;
    if (type === "shareholder" && graphSubType.ajScope.totalshareholder === 0) {
      hAxisTick = _this.getDefaultTicks();
    } else if (
      type === "management" &&
      graphSubType.ajScope.totalmanagement === 0
    ) {
      hAxisTick = _this.getDefaultTicks();
    }
    return {
      title: graphSubType.attrs.titletxt,
      titleTextStyle: {
        color: "#666",
        fontName: "Open Sans",
        fontSize: "16",
        fontWidth: "normal",
      },
      titlePosition: "none",
      width: _this.chartDivWidth,
      height: _this.chartDivHeight,
      legend: { position: "top", alignment: "end" },
      series: {
        0: {
          visibleInLegend: false,
        },
        1: {
          enableInteractivity: false,
          tooltip: "none",
          lineDashStyle: [2, 2],
          visibleInLegend: false,
        },
      },
      bar: { groupWidth: "70%" },
      isStacked: true,
      colors: graphSubType.getColors(),
      tooltip: { isHtml: true },
      vAxis: {
        titleTextStyle: {
          color: graphSubType.ajScope.vAxisTitleTextStyleColor,
        },
        count: -1,
        viewWindowMode: "pretty",
        textStyle: {
          fontSize: graphSubType.ajScope.vAxisTextStylefontSize,
          color: graphSubType.ajScope.vAxisTextStylecolor,
          fontName: graphSubType.ajScope.vAxisTextStyleFontName,
        },
        baselineColor: graphSubType.ajScope.vAxisBaselineColor,
      },
      backgroundColor: graphSubType.ajScope.backgroundColor,
      hAxis: {
        titleTextStyle: {
          color: graphSubType.ajScope.hAxisTitleTextStyleColor,
        },
        count: -1,
        viewWindowMode: "pretty",
        textStyle: {
          fontSize: graphSubType.ajScope.hAxisTextStylefontSize,
          color: graphSubType.ajScope.hAxisTextStylecolor,
          fontName: graphSubType.ajScope.hAxisTextStyleFontName,
        },
        ticks: hAxisTick,
      },
      chartArea: {
        width: _this.chartInnerWidth,
        height: _this.chartInnerHeight,
        left: 160,
        top: 30,
        right: 20,
      },
    };
  },
  processEmptyChartData: function (chartData) {
    for (var i = 1, j = chartData.length; i < j; ++i) {
      chartData[i][3] = 10;
    }
  },
  drawChart: function (type) {    
    var _this = votesCastByProposalCategoryGraph;
    var graphSubType = votesCastByProposalCategoryGraph[type];
    if (graphSubType.chartData !== undefined) {
		var graphHeight = (graphSubType.chartData.length - 1) * 32;
		if(graphHeight> 1000){
			graphHeight = 1000;
		}
		$("#ShareChart,#MgmtChart").css("height", graphHeight+ "px");
      if (
        type === "shareholder" &&
        graphSubType.ajScope.totalshareholder === 0
      ) {
        $("#ShareChart").css("visibility", "visible");
        _this.processEmptyChartData(graphSubType.chartData);
      } else if (
        type === "management" &&
        graphSubType.ajScope.totalmanagement === 0
      ) {
        $("#MgmtChart").css("visibility", "visible");
        _this.processEmptyChartData(graphSubType.chartData);
      }
      var data = google.visualization.arrayToDataTable(graphSubType.chartData);
      var groupWid = "70%";
      if (graphSubType.chartData.length > 3) groupWid = "70%";
      else groupWid = "20%";
      var view = new google.visualization.DataView(data);
      view.hideColumns([5]);
      var options = _this.getOptions(type);
      _this.updateVAxisFontSize(graphSubType.chartData.length, options);
      options.bar = { groupWidth: groupWid };
      var chart = new google.visualization.BarChart(
        document.getElementById(graphSubType.attrs.id)
      );
      chart.draw(view, options);
      graphSubType.ajScope.InteractiveGraphs =
        _this.vdsServices.getPreference().InteractiveGraphs;
      if (graphSubType.ajScope.InteractiveGraphs == true) {
        google.visualization.events.addListener(
          chart,
          "onmouseover",
          graphSubType.onmouseoverHandler
        );
        google.visualization.events.addListener(
          chart,
          "onmouseout",
          graphSubType.onmouseoutHandler
        );
        google.visualization.events.addListener(chart, "ready", function () {
          google.visualization.events.addListener(chart, "select", function () {
            var _this = votesCastByProposalCategoryGraph;
            var graphSubType = votesCastByProposalCategoryGraph[type];
            var chartObject = chart;
            var selection = chartObject.getSelection();
            if (selection.length && selection[0].row !== null) {
              showHideMeetingList(
                graphSubType.ajScope,
                "MeetingProposal_list",
                "expandCollapseProposal_List",
                1
              );
              clearRemainingGraphselected(
                graphSubType.ajScope,
                "selectedProposalGraphList"
              );
              $(".selectedProposalGraphList").css("display", "block");
              graphSubType.ajScope.$apply(function () {
                graphSubType.ajScope.$parent.selectedProposalGraphList.name =
                  data.getValue(chartObject.getSelection()[0].row, 0);
                graphSubType.ajScope.$parent.selectedProposalGraphList.clear = true;
              });
              var map = [
                {
                  key: "proposalType",
                  value: type === "shareholder" ? "S" : "M",
                },
                {
                  key: "proposalCategoryName",
                  value: encodeURIComponent(
                    data.getValue(chartObject.getSelection()[0].row, 5)
                  ),
                },
				{key: 'isInteractiveGraphCall', value: 1}
              ];
              graphSubType.ajScope.$parent.getMeetingList(map);
              $("#meetingDisplayGrid").show("500");
              var change = document.getElementById(
                "expandCollapseProposal_List"
              );
              $("#" + "MeetingProposal_list" + "_header").css(
                "display",
                "block"
              );
              change.innerHTML =
                "<span class='glyphicon glyphicon-minus'></span> " +
                _this.vdsServices.getPreferLanguageProperties().Collapse +
                "";
            }
          });
        });
      }
    }
    //To clear unused references and to set the state to the default one
    _this.clearReferences(type);
  },
  clearReferences: function (type) {
    var _this = votesCastByProposalCategoryGraph;
    _this[type].hAxisTick = null;
    _this[type].chartData = null;
    _this.chartDivWidth = "100%";
    _this.chartDivHeight = "60%";
    _this.chartInnerWidth = "100%";
    _this.chartInnerHeight = "90%";
    _this.chartSlantedTextAngle = 45;
  },
};
// VDS-990: 'Votes Cast by Proposal Category' graph helper function - [END]

vdsApp.directive('stackbar', function (vdsServices) {
	return {
		restrict: 'EA',
		template: '<div style="position: relative; float: right; width: 100%; margin-top: 10px;margin-bottom: 40px;margin-right: 10px;"></div>',
		replace: true,
		controller: function ($scope)
		{
			$scope.customDashboardProperties = vdsServices.getCustomProperties();
		},
		link: function ($scope, element, attrs) {
			votesCastByProposalCategoryGraph.vdsServices = vdsServices;

			// google.charts.setOnLoadCallback(votesCastByProposalCategoryGraph.drawChart);
			var chartData = eval(attrs.chartdata);			

			var chartTitle = attrs.titletxt.toLowerCase();
			//console.log(attrs);

			//var strFree = 'Management sponsored '+numberWithCommas(attrs.totalmanagement)+' proposals during the period, where shareholders sponsored '+numberWithCommas(attrs.totalshareholder)+' proposals, with Director Related and SH-Dirs\' Related representing the categories with the most proposals, respectively.'

			/************** Section to Identify Missing columns *******************/
			//var res = chartData.toString().split(",");
			//	console.log(arrayDefined1.length);
			//	console.log(res.length);
			//	console.log(arrayDefined1.length);
			//for(i=0;i<arrayDefined1.length;i++) {			  
			//for(j=0;j<res.length;j++) {	  
			
			//VDS-990: Removed the section to identify missing columns, since the server's response will be having those values
			chartData.sort(function(a,b){
				return a[0].localeCompare(b[0]);
			});
			for(i=0;i<chartData.length;i++)
			{
				if(chartData[i][0] != "" && vdsServices.getPreferLanguageProperties()[chartData[i][0]] != null)
				{
					chartData[i][0] = vdsServices.getPreferLanguageProperties()[chartData[i][0]];
				}
			}

			var colorBack = $scope.colorBack;//'#E3E3E3'
			var chartDataVal = new Array();
			var str, txt;
			for (var i in chartData) {
				if (i > 0) {
					chartDataVal[i - 1] = parseInt(chartData[i][1]);
					if($scope.customDashboardProperties.directiveFile == 'global'|| $scope.customDashboardProperties.customInteractive == 'true')
					{
					chartData[i][5] = chartData[i][3];  //for interactive graph
					}
					chartData[i][3] = 0;
					chartData[i][4] = 'color:' + colorBack;
					if (chartData[i][1] > 1) {
						//	console.log(chartData[i][1]);
						txt = vdsServices.getPreferLanguageProperties().proposals;
					}
					else
						txt = vdsServices.getPreferLanguageProperties().proposal;
					str = chartData[i][0] + ' | ' + numberWithCommas(chartData[i][1]) + txt;
					//newStr = chartData[i][0] +'<span class="text"> ('+ numberWithCommas(chartData[i][1]) +') </span>';
					//console.log(attrs);
					if (attrs.pdfchart == 1)     // Generate a PDF for the client
					{
						chartData[i][0] = chartData[i][0] + ' (' + numberWithCommas(chartData[i][1]) + ')';
						votesCastByProposalCategoryGraph.chartDivWidth = "110%";
						votesCastByProposalCategoryGraph.chartDivHeight = "70%";
						votesCastByProposalCategoryGraph.chartInnerWidth = "100%";
						votesCastByProposalCategoryGraph.chartInnerHeight = "85%";
						votesCastByProposalCategoryGraph.chartSlantedTextAngle = 52;
					}
					else {
						chartData[i][0] = chartData[i][0];
					}
					chartData[i][2] = createCustomHTMLContent(str);
				}
			}

			var MaxArrayVal = Math.max.apply(Math, chartDataVal);
			var p = parseInt(MaxArrayVal / 1000);
			var param = 1000;
			if (p == 0) {
				p = parseInt(MaxArrayVal / 100);
				param = 100;
				if (p == 0) {
					param = 10;
				}
			}

			MaxArrayVal = parseInt((1 * MaxArrayVal));
			MaxArrayVal = Math.ceil(MaxArrayVal / param) * param;
			for (var i in chartData) {
				if (i > 0) {
					chartData[i][3] = (MaxArrayVal - chartData[i][1]);
					if ((chartData[i][1] / MaxArrayVal) <= 0.025) {
						if (chartData[i][1] != 0) {
							chartData[i][1] = MaxArrayVal * 2.5 / 100;
						} else {
							chartData[i][1] = 0;
						}
						chartData[i][3] = (MaxArrayVal - chartData[i][1]);
					}
				}
			}


			function numberWithCommas(x) {
				return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}

			var hAxisTick = new Array();
			var j = 0;
			var RangeArr = new Array(7, 6, 5, 4);
			var valueMod;
			for (k = 0; k <= 3; k++) {
				valueMod = MaxArrayVal % RangeArr[k];
				if (valueMod == 0) {
					loopVar = RangeArr[k];
					break;
				}
			}

			for (i = 0; i <= loopVar; i++) {
				/*j = (i)*(MaxArrayVal / loopVar);
				k = parseInt(j/param) * param;*/
				k = j = (i) * (MaxArrayVal / loopVar);
				/*k = parseInt(j/param) * param;*/
				hAxisTick[i] = { v: k, f: j };
			}
			votesCastByProposalCategoryGraph[chartTitle].hAxisTick = hAxisTick;
			votesCastByProposalCategoryGraph[chartTitle].attrs = attrs;
			votesCastByProposalCategoryGraph[chartTitle].ajScope = $scope;
			votesCastByProposalCategoryGraph[chartTitle].chartData = chartData;
			votesCastByProposalCategoryGraph.drawChart(chartTitle);

			// $(document).ready(function () {
			// 	$(window).resize(function () {
			// 		votesCastByProposalCategoryGraph.drawChart();
			// 	});
			// });

			function createCustomHTMLContent(testElementVal) {
				return '<div style="font-weight:normal;">' + testElementVal + '</div>';
			}

			setTimeout(function () {
				$(attrs.id + ' svg g').eq(1).hide();
				$(attrs.id + ' svg g').eq(2).hide();
			}, 10);
			
			if ('#' + attrs.id == "#MgmtChartPDF" || '#' + attrs.id == "#ShareChartPDF") {
				//console.log("Entered");
				$('#' + attrs.id).css('display', 'none');
			}
		}
	};
});

// VDS-990: 'Alignment with Management by Proposal Category' graph helper function - [START]
var votingCastAlignMgmtProposalCategoryGraph = {
  shareholder: {
    attrs: null,
    ajScope: null,
    hAxisTick: null,
    chartData: null,
    getColors: function () {
      var _this = votingCastAlignMgmtProposalCategoryGraph;
      return _this.getColors(_this.shareholder.attrs.colors);
    },
    onmouseoverHandler: function () {
      var graphSubType = votingCastAlignMgmtProposalCategoryGraph.shareholder;
      document.getElementById(graphSubType.attrs.id).style.cursor = "pointer";
    },
    onmouseoutHandler: function () {
      var graphSubType = votingCastAlignMgmtProposalCategoryGraph.shareholder;
      document.getElementById(graphSubType.attrs.id).style.cursor = "default";
    },
  },
  management: {
    attrs: null,
    ajScope: null,
    hAxisTick: null,
    chartData: null,
    getColors: function () {
      var _this = votingCastAlignMgmtProposalCategoryGraph;
      return _this.getColors(_this.management.attrs.colors);
    },
    onmouseoverHandler: function () {
      var graphSubType = votingCastAlignMgmtProposalCategoryGraph.management;
      document.getElementById(graphSubType.attrs.id).style.cursor = "pointer";
    },
    onmouseoutHandler: function () {
      var graphSubType = votingCastAlignMgmtProposalCategoryGraph.management;
      document.getElementById(graphSubType.attrs.id).style.cursor = "default";
    },
  },
  vdsServices: null,
  chartDivWidth: "100%",
  chartDivHeight: "60%",
  chartInnerWidth: "100%",
  chartInnerHeight: "90%",
  chartSlantedTextAngle: 45,
  getColors: function (colors) {
    var colorsArray = colors.split(",");
    if (colorsArray.length < 2) {
      colorsArray.push(colorsArray[0]);
    }
    return colorsArray.map(function (item) {
      return item.trim();
    });
  },
  getDefaultTicks: function () {
    var ticks = [];
    for (var i = 0; i < 6; ++i) {
      var j = 2 * i;
      ticks[i] = { v: j, f: j };
    }
    return ticks;
  },
  updateVAxisFontSize: function (chartDataLength, options) {
    if (
      typeof options === "undefined" ||
      options === null ||
      chartDataLength < 11
    ) {
      return;
    }
    try {
      var vAxisFontSize =
        parseInt(options.vAxis.textStyle.fontSize);
      if (vAxisFontSize > 14) {
        options.vAxis.textStyle.fontSize = 14;
      } else if (vAxisFontSize < 11) {
        options.vAxis.textStyle.fontSize = 11;
      } else {
        options.vAxis.textStyle.fontSize = vAxisFontSize;
      }
    } catch (err) {
      console.error(err);
    }
  },
  getOptions: function (type) {
    var _this = votingCastAlignMgmtProposalCategoryGraph;
    var graphSubType = votingCastAlignMgmtProposalCategoryGraph[type];
    var hAxisTick = graphSubType.hAxisTick;
    if (type === "shareholder" && graphSubType.ajScope.totalshareholder === 0) {
      hAxisTick = _this.getDefaultTicks();
    } else if (
      type === "management" &&
      graphSubType.ajScope.totalmanagement === 0
    ) {
      hAxisTick = _this.getDefaultTicks();
    }
    return {
      title: graphSubType.attrs.titletxt,
      titleTextStyle: {
        color: "#666",
        fontName: "Open Sans",
        fontSize: "16",
        fontWidth: "normal",
      },
      titlePosition: "none",
      width: _this.chartDivWidth,
      height: _this.chartDivHeight,
      legend: { position: "bottom", alignment: "center" },
      series: {
        2: {
          enableInteractivity: false,
          tooltip: "none",
          lineDashStyle: [2, 2],
          visibleInLegend: false,
        },
      },
      bar: { groupWidth: "70%" },
      isStacked: true,
      colors: graphSubType.getColors(),
      tooltip: { isHtml: true },
      vAxis: {
        titleTextStyle: {
          color: graphSubType.ajScope.vAxisTitleTextStyleColor,
        },
        count: -1,
        viewWindowMode: "pretty",
        textStyle: {
          fontSize: graphSubType.ajScope.vAxisTextStylefontSize,
          color: graphSubType.ajScope.vAxisTextStylecolor,
          fontName: graphSubType.ajScope.vAxisTextStyleFontName,
        },
        baselineColor: graphSubType.ajScope.vAxisBaselineColor,
      },
      backgroundColor: graphSubType.ajScope.backgroundColor,
      hAxis: {
        titleTextStyle: {
          color: graphSubType.ajScope.hAxisTitleTextStyleColor,
        },
        count: -1,
        viewWindowMode: "pretty",
        textStyle: {
          fontSize: graphSubType.ajScope.hAxisTextStylefontSize,
          color: graphSubType.ajScope.hAxisTextStylecolor,
          fontName: graphSubType.ajScope.hAxisTextStyleFontName,
        },
        ticks: hAxisTick,
      },
      chartArea: {
        width: _this.chartInnerWidth,
        height: _this.chartInnerHeight,
        left: 160,
        right: 20,
        bottom: 50,
      },
    };
  },
  processEmptyChartData: function (chartData) {
    for (var i = 1, j = chartData.length; i < j; ++i) {
      chartData[i][5] = 10;
    }
  },
  drawChart: function (type) {
    var _this = votingCastAlignMgmtProposalCategoryGraph;
    var graphSubType = votingCastAlignMgmtProposalCategoryGraph[type];
    if (graphSubType.chartData !== undefined) {
		var graphHeight = (graphSubType.chartData.length - 1) * 32;
		if(graphHeight> 1000){
			graphHeight = 1000;
		}
		$("#shareChartAlignMgmtProposal,#mgmtChartAlignMgmtProposal").css("height", graphHeight+ "px");
      if (
        type === "shareholder" &&
        graphSubType.ajScope.totalshareholder === 0
      ) {
        $("#shareChartAlignMgmtProposal")
          .css("visibility", "visible");
        _this.processEmptyChartData(graphSubType.chartData);
      } else if (
        type === "management" &&
        graphSubType.ajScope.totalmanagement === 0
      ) {
        $("#mgmtChartAlignMgmtProposal")
          .css("visibility", "visible");
        _this.processEmptyChartData(graphSubType.chartData);
      }
      var data = google.visualization.arrayToDataTable(graphSubType.chartData);
      var groupWid = "70%";
      if (graphSubType.chartData.length > 3) groupWid = "70%";
      else groupWid = "20%";
      var view = new google.visualization.DataView(data);
      view.hideColumns([7]);
      var options = _this.getOptions(type);
      _this.updateVAxisFontSize(graphSubType.chartData.length, options);
      options.bar = { groupWidth: groupWid };
      var chart = new google.visualization.BarChart(
        document.getElementById(graphSubType.attrs.id)
      );
      chart.draw(view, options);
      graphSubType.ajScope.InteractiveGraphs =
        _this.vdsServices.getPreference().InteractiveGraphs;
      if (graphSubType.ajScope.InteractiveGraphs == true) {
        google.visualization.events.addListener(
          chart,
          "onmouseover",
          graphSubType.onmouseoverHandler
        );
        google.visualization.events.addListener(
          chart,
          "onmouseout",
          graphSubType.onmouseoutHandler
        );
        google.visualization.events.addListener(chart, "ready", function () {
          google.visualization.events.addListener(chart, "select", function () {
            var _this = votingCastAlignMgmtProposalCategoryGraph;
            var graphSubType = votingCastAlignMgmtProposalCategoryGraph[type];
            var chartObject = chart;
            var selection = chartObject.getSelection();
            if (selection.length && selection[0].row !== null) {
              showHideMeetingList(
                graphSubType.ajScope,
                "meetingAlignMgmtProposalList",
                "expandCollapseAlignMgmtProposalList",
                1
              );
              clearRemainingGraphselected(
                graphSubType.ajScope,
                "selectedAlignMgmtProposalGraphList"
              );
              $(".selectedAlignMgmtProposalGraphList").css("display", "block");
              graphSubType.ajScope.$apply(function () {
                graphSubType.ajScope.$parent.selectedAlignMgmtProposalGraphList.name =
                  data.getValue(chartObject.getSelection()[0].row, 0);
                graphSubType.ajScope.$parent.selectedAlignMgmtProposalGraphList.clear = true;
              });
              var map = [
                {
                  key: "proposalType",
                  value: type === "shareholder" ? "S" : "M",
                },
                {
                  key: "proposalCategoryName",
                  value: encodeURIComponent(
                    data.getValue(chartObject.getSelection()[0].row, 7)
                  ),
                },
                {
                  key: "managementCode",
                  value:
                    chartObject.getSelection()[0].column === 3 ? "AM" : "WM",
                },
				{key: 'isInteractiveGraphCall', value: 1}
              ];
              graphSubType.ajScope.$parent.getMeetingList(map);
              $("#meetingDisplayGrid").show("500");
              var change = document.getElementById(
                "expandCollapseAlignMgmtProposalList"
              );
              $("#meetingAlignMgmtProposalProposalList_header").css(
                "display",
                "block"
              );
              change.innerHTML =
                "<span class='glyphicon glyphicon-minus'></span> " +
                _this.vdsServices.getPreferLanguageProperties().Collapse +
                "";
            }
          });
        });
      }
    }
    //To clear unused references and to set the state to the default one
    _this.clearReferences(type);
  },
  clearReferences: function (type) {
    var _this = votingCastAlignMgmtProposalCategoryGraph;
    _this[type].hAxisTick = null;
    _this[type].chartData = null;
    _this.chartDivWidth = "100%";
    _this.chartDivHeight = "60%";
    _this.chartInnerWidth = "100%";
    _this.chartInnerHeight = "90%";
    _this.chartSlantedTextAngle = 45;
  },
};
// VDS-990: 'Alignment with Management by Proposal Category' graph helper function - [END]

vdsApp.directive("stackedBar", function (vdsServices) {
  return {
    restrict: "EA",
    template:
      '<div style="position: relative; float: right; width: 100%; margin-top: 10px;margin-bottom: 40px;margin-right: 10px;"></div>',
    replace: true,
    controller: function ($scope) {
      $scope.customDashboardProperties = vdsServices.getCustomProperties();
    },
    link: function ($scope, element, attrs) {
      votingCastAlignMgmtProposalCategoryGraph.vdsServices = vdsServices;

      var chartData = eval(attrs.chartdata);

      var chartTitle = attrs.titletxt.toLowerCase();
      chartData.sort(function (a, b) {
        return a[0].localeCompare(b[0]);
      });

      for (var i = 0, j = chartData.length; i < j; ++i) {
		chartData[i][0] = vdsAppHelper.getLangProperty(chartData[i][0]);
      }

      var colorBack = $scope.colorBack;
      var chartDataVal = new Array();
      var str1, str2, txt;
      for (var i in chartData) {
        if (i > 0) {
          chartDataVal[i - 1] = parseInt(chartData[i][1] + chartData[i][3]);
          if (
            $scope.customDashboardProperties.directiveFile == "global" ||
            $scope.customDashboardProperties.customInteractive == "true"
          ) {
            chartData[i][7] = chartData[i][5];
          }
          chartData[i][5] = 0;
          chartData[i][6] = "color:" + colorBack;
          if (chartData[i][1] > 1) {
            txt = vdsServices.getPreferLanguageProperties().proposals;
          } else txt = vdsServices.getPreferLanguageProperties().proposal;
          str1 =
            chartData[i][0] + " | " + numberWithCommas(chartData[i][1]) + txt;
          str2 =
            chartData[i][0] + " | " + numberWithCommas(chartData[i][3]) + txt;
          chartData[i][2] = createCustomHTMLContent(
            str1,
            vdsAppHelper.getLangProperty("Voted With Management")
          );
          chartData[i][4] = createCustomHTMLContent(
            str2,
            vdsAppHelper.getLangProperty("Voted Against Management")
          );
        }
      }

      var MaxArrayVal = Math.max.apply(Math, chartDataVal);
      var p = parseInt(MaxArrayVal / 1000);
      var param = 1000;
      if (p == 0) {
        p = parseInt(MaxArrayVal / 100);
        param = 100;
        if (p == 0) {
          param = 10;
        }
      }

      MaxArrayVal = parseInt(1 * MaxArrayVal);
      MaxArrayVal = Math.ceil(MaxArrayVal / param) * param;
      for (var i in chartData) {
        if (i > 0) {
          if (chartData[i][1] / MaxArrayVal <= 0.025) {
            if (chartData[i][1] != 0) {
              chartData[i][1] = (MaxArrayVal * 2.5) / 100;
            }
          }
          if (chartData[i][3] / MaxArrayVal <= 0.025) {
            if (chartData[i][3] != 0) {
              chartData[i][3] = (MaxArrayVal * 2.5) / 100;
            }
          }
          chartData[i][5] = MaxArrayVal - chartData[i][1] - chartData[i][3];
        }
      }

      function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      var hAxisTick = new Array();
      var j = 0;
      var RangeArr = new Array(7, 6, 5, 4);
      var valueMod;
      for (k = 0; k <= 3; k++) {
        valueMod = MaxArrayVal % RangeArr[k];
        if (valueMod == 0) {
          loopVar = RangeArr[k];
          break;
        }
      }

      for (i = 0; i <= loopVar; i++) {
        k = j = i * (MaxArrayVal / loopVar);
        hAxisTick[i] = { v: k, f: j };
      }
      votingCastAlignMgmtProposalCategoryGraph[chartTitle].hAxisTick =
        hAxisTick;
      votingCastAlignMgmtProposalCategoryGraph[chartTitle].attrs = attrs;
      votingCastAlignMgmtProposalCategoryGraph[chartTitle].ajScope = $scope;
      votingCastAlignMgmtProposalCategoryGraph[chartTitle].chartData =
        chartData;
      votingCastAlignMgmtProposalCategoryGraph.drawChart(chartTitle);

      function createCustomHTMLContent(testElementVal, elementType) {
        return (
          "<div style='font-weight:bold;text-align:left'>" +
          elementType +
          "</div>" +
          "<div style='font-weight:normal;text-align:left'>" +
          testElementVal +
          "</div>"
        );
      }

      setTimeout(function () {
        $(attrs.id + " svg g")
          .eq(1)
          .hide();
        $(attrs.id + " svg g")
          .eq(2)
          .hide();
      }, 10);
    },
  };
});






