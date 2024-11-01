document.getElementById("duplicateCheck").addEventListener("click", function () {
    const password = document.getElementById("password").value;
    
    // Replace with actual check to the database
    if (password === "existingPassword") {
        alert("이미 사용 중인 비밀번호입니다.");
    } else {
        alert("사용 가능한 비밀번호입니다.");
    }
});

document.getElementById("confirmButton").addEventListener("click", function () {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const target = document.getElementById("target").value;
    const password = document.getElementById("password").value;

    // Replace with actual DB update function
    console.log("Updating user info:", { name, age, target, password });
    alert("회원 정보가 업데이트되었습니다.");
});
