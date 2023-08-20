import { getActiveTabURL } from "./utils.js";

const iframeSandbox = document.getElementById("sandbox");

const sendGenerationData = (currentQuestions = []) => {
    iframeSandbox.contentWindow.postMessage({
        questions_info: currentQuestions
    }, '*');
};

const generatePptx = async () => {
    const activeTab = await getActiveTabURL();
    
    if (activeTab.url.includes("db.chgk.info")) {

        chrome.tabs.sendMessage(activeTab.id, {
            type: "GIVE_UPDATE"
        }, sendGenerationData);

    }
};

document.getElementById("generate-pptx").addEventListener("click", generatePptx);

const handleEvent = (event) => {
    console.log("Got data from sandboxed page");
    let doc = URL.createObjectURL( new Blob([event.data],
        {type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'}) );
    chrome.downloads.download({url: doc, saveAs: true, filename: "exercise.pptx"})

};

window.addEventListener('message', handleEvent)
