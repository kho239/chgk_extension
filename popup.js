import { getActiveTabURL } from "./utils.js";

const addQuestion = (questionsLinks, questionNumber, questionTitle) => {
    const questionTitleElement = document.createElement("a");
    const controlsElement = document.createElement("div");
    const newQuestionElement = document.createElement("div");

    const questionLink = "https://db.chgk.info/question/" + questionTitle;

    questionTitleElement.textContent = questionNumber.toString() + "). " + questionTitle;
    questionTitleElement.className = "question-title";
    controlsElement.className = "question-controls";
    questionTitleElement.href = questionLink;

    setQuestionAttributes("delete", onDelete, controlsElement);

    newQuestionElement.id = "question-" + questionTitle;
    newQuestionElement.className = "question-link";
    newQuestionElement.setAttribute("short-link", questionTitle)

    newQuestionElement.appendChild(questionTitleElement);
    newQuestionElement.appendChild(controlsElement);
    questionsLinks.appendChild(newQuestionElement);
};

const updateTitle = (currentQuestions) => {
    const titleElement = document.getElementById("popup-title");
    titleElement.innerHTML = "Сохранённые вопросы (" + currentQuestions.length +"):"
}

const viewQuestions = (currentQuestions=[]) => {
    updateTitle(currentQuestions);

    const questionsElement = document.getElementById("saved-questions");
    questionsElement.innerHTML = "";

    if (currentQuestions && currentQuestions.length > 0) {
        for (let i = 0; i < currentQuestions.length; i++) {
            const questionTitle = currentQuestions[i].short_link;
            addQuestion(questionsElement, i + 1, questionTitle);
        }
    } else {
        questionsElement.innerHTML = '<i class="row">Пока не добавлено ни одного вопроса</i>';
    }
};

const onDelete = async e => {
    const activeTab = await getActiveTabURL();
    const questionShortLink = e.target.parentNode.parentNode.getAttribute("short-link");
    const questionElementToDelete = document.getElementById(
        "question-" + questionShortLink
    );

    questionElementToDelete.parentNode.removeChild(questionElementToDelete);

    const currentQuestions = await chrome.tabs.sendMessage(activeTab.id, {
        type: "DELETE",
        value: questionShortLink,
    });
    viewQuestions(currentQuestions);
};

const setQuestionAttributes =  (action, eventListener, controlParentElement) => {
    const controlElement = document.createElement("span");

    controlElement.className = "small-button material-symbols-outlined";
    controlElement.title = action;
    controlElement.textContent = action;
    controlElement.draggable = false;
    controlElement.addEventListener("click", eventListener);
    controlParentElement.appendChild(controlElement);
};


document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();

    if (activeTab.url.includes("db.chgk.info")) {
        console.log("Sending request")
        const currentQuestions = await chrome.tabs.sendMessage(activeTab.id, {
            type: "GIVE_UPDATE"
        });
        console.log("response:" + currentQuestions);
        viewQuestions(currentQuestions);

    } else {
        const container = document.getElementsByClassName("container")[0];

        container.innerHTML = '<div class="title">Это не сайт с вопросами ЧГК.</div>';
    }
});

