function show() {
	document.getElementById("output").innerHTML = this.responseText;
}

var req = new XMLHttpRequest();
req.addEventListener("load", show);
req.open("GET", "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/540-1-vvypp/service/get/incoming_webhook/get-webhook");
req.send();
