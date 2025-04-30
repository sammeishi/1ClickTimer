/**
 * sammeishi
 * 2025-04-30
 */
const PopupExt = new (function () {
  // 控制器scope
  let controllerScope = null
  // 启动函数
  let startFN = null
  /**
   * 注册controller
   * 由popup调用
   * @param {*} $scope
   */
  this.onRegController = ($scope) => {
    controllerScope = $scope
    startFN = $scope.start.bind($scope)
    console.log("reg controller")
  }
  /**
   * 执行
   */
  setTimeout(() => {
    document.body.addEventListener("click", function (e) {
      console.log(e.offsetX, e.offsetY)
    })
    // 分钟文字按钮
    const minuteBtns = [
      { x: 135, y: 20, size: 30, minute: 60 },
      { x: 200, y: 31, size: 30, minute: 5 },
      { x: 239, y: 71, size: 30, minute: 10 },
      { x: 253, y: 134, size: 30, minute: 15 },
      { x: 240, y: 199, size: 30, minute: 20 },
      { x: 199, y: 240, size: 30, minute: 25 },
      { x: 135, y: 253, size: 30, minute: 30 },
      { x: 70, y: 241, size: 30, minute: 35 },
      { x: 29, y: 196, size: 30, minute: 40 },
      { x: 16, y: 136, size: 30, minute: 45 },
      { x: 28, y: 70, size: 30, minute: 50 },
      { x: 70, y: 33, size: 30, minute: 55 },
    ]
    minuteBtns.forEach((btnInfo) => {
      const btnEle = document.createElement("div")
      const text = btnInfo.minute < 10 ? "0" + btnInfo.minute : btnInfo.minute
      btnEle.innerText = text
      btnEle.style.fontSize = "20px"
      btnEle.style.position = "absolute"
      btnEle.style.display = "flex"
      btnEle.style.justifyContent = "center"
      btnEle.style.alignItems = "center"
      // btnEle.style.background = "rgba(255,0,0,0.5)"
      btnEle.style.width = btnInfo.size + "px"
      btnEle.style.height = btnInfo.size + "px"
      btnEle.style.left = btnInfo.x + "px"
      btnEle.style.top = btnInfo.y + "px"
      btnEle.style.cursor = "pointer"
      btnEle.style.zIndex = 999
      document.body.appendChild(btnEle)
      btnEle.addEventListener("click", () => {
        startFN(btnInfo.minute * 60 * 1000)
      })
    })
  }, 500)
})()
