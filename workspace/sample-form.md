---
collectEmail: true
allowMultipleResponses: false
showProgressBar: true
shuffleQuestions: false
themeColor: blue
backgroundImage: mountain
responseReceipt: whenRequested
---

# サンプルフォーム

このフォームは、すべての質問タイプを網羅するデモです。

## 基本情報セクション

個人情報に関する質問です。

### お名前を入力してください

#type short_text
#placeholder "山田 太郎"

---

### 自己紹介をお願いします

#type long_text
#placeholder "趣味や特技を書いてください"
#rows 5

---

### 年齢を入力してください

#type number
#min 0
#max 120

---

### メールアドレスを入力してください

#type email
#placeholder "example@example.com"

---

### 電話番号を入力してください

#type phone
#placeholder "090-1234-5678"

---

## 選択式セクション

複数の選択肢形式を含みます。

### 性別を選択してください

#type dropdown
#options "男性","女性","その他"

---

### 好きな飲み物を1つ選んでください

#type radio
#options "コーヒー","紅茶","水","その他"

---

### 興味のある分野をすべて選択してください

#type checkbox
#options "AI","ロボット","数学","芸術","その他"

---

## 日時セクション

日付や時間に関する質問です。

### 生年月日を入力してください

#type date

### 面談希望時間を選択してください

#type time
#minTime "09:00"
#maxTime "18:00"

---

## 評価セクション

スケールや評価関連です。

### このサービスを星で評価してください

#type rating
#scale 5
#labels "低い","高い"
#icon star

---

### 授業の満足度をお答えください

#type likert
#statements "教材の分かりやすさ","講師の説明","演習量"
#scaleLabels "全くそう思わない","あまりそう思わない","普通","そう思う","とてもそう思う"

---

### 週ごとの活動時間を記入してください

#type matrix
#rows "月曜","火曜","水曜","木曜","金曜"
#columns "午前","午後","夜"
#cellType number

---

### 英語スキルを自己評価してください

#type scale
#min 1
#max 10
#minLabel "初心者"
#maxLabel "上級者"

---

## ファイル/署名セクション

### 履歴書をアップロードしてください

#type file_upload
#allowedTypes "pdf","docx"
#maxFiles 1
#maxSizeMB 10

---

### サインをお願いします

#type signature
#captureMode draw

---

## メディア/情報セクション

### 追加情報

#type section_header
#title "お知らせ"
#subtitle "下記内容をご確認ください"

---

### サンプル画像

#type image
#src "https://example.com/sample.jpg"
#alt "サンプル画像"
#caption "説明用の画像です"

---

### サンプル動画

#type video
#src "https://example.com/sample.mp4"
#caption "紹介動画です"

---

## 最後の質問

### このサービスをまた利用したいですか？

#type boolean
#onLabel "はい"
#offLabel "いいえ"

---
