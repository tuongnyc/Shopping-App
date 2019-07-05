// code that run on the client.
//
const deleteProduct = (btn) => {
    console.log(btn);
    // get the elements
    console.log(btn.parentNode.querySelector('[name=productId]').value);
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    // find the closest DOM element!
    const productElement = btn.closest('article');

    // send the request to server.
    fetch('/admin/product/'+ prodId, { // handle by the browser to handle http request!
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }  // attached the csrf tokens.
    }).then(result => {  // data obtain from server.
        return result.json()
    }).then(data => {  // now remove the DOM element from the page.
        console.log(data);
        productElement.parentNode.removeChild(productElement);  // delete from the DOM element!
    })
    .catch(error => {
        console.log(error);
    })
}