---
collectEmail: true
allowMultipleResponses: false
limitResponses: 500
showProgressBar: true
shuffleQuestions: false
responseReceipt: whenRequested
themeColor: "#2563EB"
backgroundImage: mountain
font: "Noto Sans JP, sans-serif"
---

# md2form Full Feature Playground

This sample includes all major question types and representative properties.

## Text Inputs

### Short Text: Full Name

#type short_text
#placeholder "山田 太郎"
#required true
#maxLength 60
#default ""
#visible true

---

### Long Text: Self Introduction

#type long_text
#placeholder "自己紹介を入力してください"
#rows 4
#required false
#maxLength 300

---

### Number: Years of Experience

#type number
#placeholder "3"
#required true
#min 0
#max 40
#step 1
#integerOnly true

---

### Email: Contact Email

#type email
#placeholder "you@example.com"
#required true

---

### Phone: Mobile Number

#type phone
#placeholder "090-1234-5678"
#required false

---

## Choice Inputs

### Dropdown: Preferred Work Style

#type dropdown
#options "Remote","Hybrid","Office"
#searchable true
#allowOther false
#required true

---

### Radio: Preferred Contact Method

#type radio
#options "Email","Phone","Chat"
#allowOther false
#required true

---

### Checkbox: Skills

#type checkbox
#options "TypeScript","React","Node.js","Design"
#required true
#minSelected 1
#maxSelected 3

---

## Date and Time

### Date: Available Start Date

#type date
#required true
#includeTime false
#minDate "2026-01-01"
#maxDate "2027-12-31"

---

### Time: Preferred Interview Time

#type time
#required true
#minTime "09:00"
#maxTime "18:00"
#stepMinutes 30

---

## Scale and Evaluation

### Rating: Product Satisfaction

#type rating
#required true
#scale 5
#labels "不満","満足"
#icon star

---

### Likert: Team Survey

#type likert
#required false
#statements "目標が明確","協力しやすい","学習機会がある"
#scaleLabels "全くそう思わない","そう思わない","普通","そう思う","とてもそう思う"
#requiredPerStatement true

---

### Matrix: Weekly Availability

#type matrix
#required false
#rows "月","火","水","木","金"
#columns "午前","午後","夜"
#cellType checkbox
#requiredPerRow false

---

### Scale: Confidence Level

#type scale
#required true
#min 1
#max 10
#step 1
#minLabel "低い"
#maxLabel "高い"

---

## Upload and Signature

### File Upload: Portfolio

#type file_upload
#required false
#allowedTypes "pdf","docx","jpg","png"
#maxFiles 3
#maxSizeMB 20

---

### Signature: Agreement

#type signature
#required true
#captureMode draw

---

## Media and Layout

### Image: Company Logo

#type image
#src "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab"
#alt "Company logo"
#width auto
#height auto
#caption "Sample image block"

---

### Video: Intro Clip

#type video
#src "https://example.com/intro.mp4"
#width auto
#height auto
#caption "Sample video block"

---

### Boolean: Accept Terms

#type boolean
#required true
#onLabel "同意する"
#offLabel "同意しない"

---

### Section Header: Additional Notes

#type section_header
#title "追加情報"
#subtitle "必要に応じて補足を入力してください"
