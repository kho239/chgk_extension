chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading" && tab.url && tab.url.includes("db.chgk.info")) {
    chrome.tabs.sendMessage(tabId, {
      type: "NEW"
    }).catch(function (e) {
      console.log("An error occured while sending a message:")
      console.log(e);
      console.log("Change info:")
      console.log(changeInfo);
      console.log("Tab info:")
      console.log(tab);
    })
  }
});
