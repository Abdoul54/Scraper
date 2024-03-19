# Scraper API

## Endpoints (so far):

### **Scraping Coursera**

```curl
curl -X POST "http://example.com/api/scrape/coursera" -H "Content-Type: application/json" -d '{"url":"https://coursera.com/learn/course"}'
```

### **Scraping OpenClassRooms**

```curl
curl -X POST "http://example.com/api/scrape/openclassrooms" -H "Content-Type: application/json" -d '{"url":"https://openclassrooms.com/learn/course"}'
```

### **Scraping Fun-Mooc**

```curl
curl -X POST "http://example.com/api/scrape/funmooc" -H "Content-Type: application/json" -d '{"url":"https://fun-mooc.com/learn/course"}'
```

### **Scraping Edraak**

```curl
curl -X POST "http://example.com/api/scrape/edraak" -H "Content-Type: application/json" -d '{"url":"https://edraak.com/learn/course"}'
```

### **Scraping Unow**

```curl
curl -X POST "http://example.com/api/scrape/unow" -H "Content-Type: application/json" -d '{"url":"https://unow.fr/learn/course"}'
```
