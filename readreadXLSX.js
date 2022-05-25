window.onload = function () {
  document.getElementById('file1').addEventListener('change', taskXlsX)
  document.getElementById('file2').addEventListener('change', localJson)
  document.getElementById('comfrim').addEventListener('click', comfirm)


}




const catchFiles = {
  excel: [], // 表格数据行拆分
  json: {} // 缓存数据
}

function comfirm() {
  document.getElementById('comfrim').removeEventListener('click', comfirm)
  compareFlies()
  document.getElementById('comfrim').addEventListener('click', comfirm)
}


function taskXlsX(e) {
  const file = e.target.files[0]
  e.target.value = ''
  document.getElementById('taskList').innerText = file.name

  if (!file) return
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: 'binary' });

    let Sheetslist = []

    for (var sheet in workbook.Sheets) {
      if (workbook.Sheets.hasOwnProperty(sheet)) {
        var fromTo = workbook.Sheets[sheet]['!ref'];
        if (fromTo) Sheetslist = Sheetslist.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
      }
    }


    catchFiles.excel = Sheetslist.reduce((result, item) => {
      let obj = {}
      for (let key in item) {
        obj[key.trim()] = item[key].trim()
      }
      result.push(obj)
      return result
    }, [])
  };
  reader.readAsBinaryString(file);
}
// 如果这里是json文件

function localJson(e) {
  let file = Array.from(e.target.files)
  e.target.value = ''
  document.getElementById('localList').innerText = ''
  file.forEach(file => {
    let reader = new FileReader();

    reader.readAsText(file);
    document.getElementById('localList').innerText += file.name + ';'
    reader.onload = function (e) {
      let data = e.target.result;
      if (!data) return
      data = JSON.parse(data)
      catchFiles.json[file.name] = data
    };
  })
}
// 用中文 为基准
function compareFlies() {
  let { json, excel } = catchFiles
  let jsonStr = unlockObject(json['ZH.json'])
  let jsonKeys = Object.keys(jsonStr)
  let jsonValues = Object.values(jsonStr)
  const key = new Date() - 0 + ''
  excel.forEach((excelWord) => {
    let Indexs = findWordPath(excelWord, jsonValues)
    if (Indexs.length) readWordPath(Indexs, jsonKeys, excelWord)
    else createWord(excelWord, key)
  })
  console.log(json)
}
// 将找到的数据进行赋值
function readWordPath(Indexs, jsonKeys, excelWord) {
  // 这里应该是除了中文 之外其他的文件
  Indexs.forEach((index) => {
    const path = jsonKeys[index]
    if (path) whirteWord(path, excelWord)
  })
}

function whirteWord(path, excelWord) {
  const { json } = catchFiles
  for (let key in json) {
    let currentValue = json[key]
    if (key !== 'ZH.json') {
      path.split('.').forEach((pathKey, pathIndex) => {
        if (!currentValue[pathKey]) currentValue[pathKey] = {}
        if (pathIndex === path.split('.').length - 1) {
          currentValue[pathKey] = excelWord[key.split('.')[0]] || excelWord['zh'] + '没有返回数据'
        } else {
          currentValue = currentValue[pathKey]
        }
      })
    }
  }
}

//  以中文作为基础
function createWord(excelWord, createdKey) {
  let { json } = catchFiles
  for (let key in excelWord) {
    json[key + '.json'][createdKey] = json[key + '.json'][createdKey] || {}
    json[key + '.json'][createdKey][excelWord['US']] = excelWord[key]
  }
}

// 递归 将数据 组装
function unlockObject(jsonData, parentKey) {
  let objectList = {}
  for (var key in jsonData) {
    if (jsonData[key] && typeof (jsonData[key]) == 'object') {
      if (parentKey) objectList = Object.assign(objectList, unlockObject(jsonData[key], parentKey + '.' + key))
      else objectList = Object.assign(objectList, unlockObject(jsonData[key], key))
    } else {
      if (parentKey) objectList[parentKey + '.' + key] = jsonData[key]
      else objectList[key] = jsonData[key]
    }
  }
  return objectList
}

// 以中文为路径翻译
function findWordPath(excelWord, jsonValues) {
  let word = excelWord.zh || excelWord.ZH

  const results = []
  let len = jsonValues.length
  let pos = 0
  while (pos < len) {
    pos = jsonValues.indexOf(word, pos);
    if (pos === -1) {
      break;
    }
    results.push(pos);
    pos += 1;
  }
  return results;
}

// 下载文件
function downFlies(data, filename = 'json1.json') {
  if (typeof data === 'object') {
    data = JSON.stringify(data)
  }
  var blob = new Blob([data], { type: 'text/json' })
  e = document.createEvent('MouseEvents')
  a = document.createElement('a')
  a.download = filename
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
  e.initMouseEvent('click')
  a.dispatchEvent(e)
}