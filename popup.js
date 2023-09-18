import { getActiveTabURL } from "./utils.js";

const addQuestion = (questionsLinks, questionNumber, questionShortLink, questionAnswer) => {
    const questionTitleElement = document.createElement("a");
    const controlsElement = document.createElement("div");
    const newQuestionElement = document.createElement("div");

    const questionLink = "https://db.chgk.info/question/" + questionShortLink;

    questionTitleElement.textContent = questionNumber.toString() + "). " + questionAnswer;
    questionTitleElement.className = "question-title";
    controlsElement.className = "question-controls";
    questionTitleElement.href = questionLink;

    setQuestionAttributes("delete", onDelete, controlsElement);

    newQuestionElement.id = "question-" + questionShortLink;
    newQuestionElement.className = "question-link";
    newQuestionElement.setAttribute("short-link", questionShortLink);

    newQuestionElement.addEventListener("dragstart", () => {
        // Adding dragging class to an item after the start of a drag
        setTimeout(() => newQuestionElement.classList.add("dragging"), 0);
    });
    newQuestionElement.addEventListener("dragend", () => {
        // Removing that class after drag ends
        newQuestionElement.classList.remove("dragging")
    });

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
            const questionShortLink = currentQuestions[i].short_link;
            const questionAnswer = currentQuestions[i].answerText;
            addQuestion(questionsElement, i + 1, questionShortLink, questionAnswer);
        }
    } else {
        questionsElement.innerHTML = '<i class="row">Пока не добавлено ни одного вопроса</i>';
    }

    sortable('.saved-questions');
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

const moveQuestionBefore = async (movedQuestion, questionBeforeWhichMoveTo) => {
    const activeTab = await getActiveTabURL();

    const currentQuestions = await chrome.tabs.sendMessage(activeTab.id, {
        type: "MOVE",
        value:{
            moved: movedQuestion.getAttribute("short-link"),
            before_which: questionBeforeWhichMoveTo.getAttribute("short-link")
        }
    });
    viewQuestions(currentQuestions);
}

const moveQuestionBeforeByIndex = async (fromIndex, toIndex) => {
    const activeTab = await getActiveTabURL();

    const currentQuestions = await chrome.tabs.sendMessage(activeTab.id, {
        type: "MOVE",
        value:{
            from: fromIndex,
            to: toIndex
        }
    });
    viewQuestions(currentQuestions);
}

sortable(".saved-questions", {
    forcePlaceholderSize: true
});
sortable('.saved-questions')[0].addEventListener('sortupdate', async (e) => {
    await moveQuestionBeforeByIndex(e.detail.origin.index, e.detail.destination.index);
});

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();

    if (activeTab.url.includes("db.chgk.info")) {
        const currentQuestions = await chrome.tabs.sendMessage(activeTab.id, {
            type: "GIVE_UPDATE"
        });
        viewQuestions(currentQuestions);

    } else {
        const container = document.getElementsByClassName("container")[0];

        container.innerHTML = '<div class="title">Это не сайт с вопросами ЧГК.</div>';
    }
});

