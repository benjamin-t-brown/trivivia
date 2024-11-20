window.onbeforeunload = function(){
  return 'Are you sure you want to leave?';
};
var element = document.querySelector('.modal-backdrop');
if (element) {
  element.classList.remove('modal-backdrop');
}
var xpath = "//button[text()='Just Watch']";
document
  .evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  )
  .singleNodeValue.click();