#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define ESP_ID "ESP_RELAY_ROOM_101"

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);

int relayPins[] = {
  4, 5, 12, 13, 14,
  18, 19, 21, 22, 23,
  25, 26, 27,
  32, 33
};

int pinCount = sizeof(relayPins) / sizeof(relayPins[0]);


unsigned long lastActiveTime[40];
bool manualHold[40];
const unsigned long RELAY_TIMEOUT = 4000;

bool activePinsState[40];      
bool lastSentState[40];        

unsigned long lastStatusSend = 0;
const unsigned long STATUS_INTERVAL = 4000;


void sendActivePins() {

  StaticJsonDocument<256> doc;
  doc["espId"] = ESP_ID;

  JsonArray arr = doc.createNestedArray("activePins");

  for (int i = 0; i < pinCount; i++) {
    int pin = relayPins[i];
    if (activePinsState[pin]) {
      arr.add(pin);
    }
  }

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish("powernest/status/ESP_RELAY_ROOM_101", buffer);
  Serial.println("Status sent to server");
}

void copyCurrentToLast() {
  for (int i = 0; i < 40; i++) {
    lastSentState[i] = activePinsState[i];
  }
}

bool hasChanged() {
  for (int i = 0; i < 40; i++) {
    if (activePinsState[i] != lastSentState[i]) {
      return true;
    }
  }
  return false;
}


void callback(char* topic, byte* payload, unsigned int length) {

  String msg;
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  int pin = String(topic)
              .substring(String(topic).lastIndexOf("/") + 1)
              .toInt();

  if (msg == "ON") {
    digitalWrite(pin, HIGH);
    manualHold[pin] = false;
    lastActiveTime[pin] = millis();
    activePinsState[pin] = true;   
    Serial.println("Relay PIN " + String(pin) + " -> ON (AUTO)");
  }

  else if (msg == "ON_MANUAL") {
    digitalWrite(pin, HIGH);
    manualHold[pin] = true;
    activePinsState[pin] = true;   
    Serial.println("Relay PIN " + String(pin) + " -> ON (MANUAL)");
  }

  else if (msg == "OFF") {
    digitalWrite(pin, LOW);
    manualHold[pin] = false;
    activePinsState[pin] = false;  
    Serial.println("Relay PIN " + String(pin) + " -> OFF");
  }
}


void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void connectMQTT() {
  while (!client.connected()) {
    if (client.connect(ESP_ID)) {
      client.subscribe("powernest/ESP_RELAY_ROOM_101/relay/+");
    } else {
      delay(2000);
    }
  }
}


void setup() {

  Serial.begin(115200);

  for (int i = 0; i < pinCount; i++) {
    int pin = relayPins[i];

    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);

    lastActiveTime[pin] = 0;
    manualHold[pin] = false;
    activePinsState[pin] = false;
    lastSentState[pin] = false;
  }

  connectWiFi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  connectMQTT();

  Serial.println("RELAY ESP READY: " ESP_ID);
}


void loop() {

  if (!client.connected()) connectMQTT();
  client.loop();

  unsigned long now = millis();

  for (int i = 0; i < pinCount; i++) {
    int pin = relayPins[i];

    if (!manualHold[pin] &&
        digitalRead(pin) == HIGH &&
        now - lastActiveTime[pin] > RELAY_TIMEOUT) {

      digitalWrite(pin, LOW);
      activePinsState[pin] = false;   
      Serial.println("Relay PIN " + String(pin) + " -> AUTO OFF");
    }
  }

  if (hasChanged()) {
    sendActivePins();
    copyCurrentToLast();
  }

  if (now - lastStatusSend > STATUS_INTERVAL) {
    sendActivePins();
    copyCurrentToLast();
    lastStatusSend = now;
  }

  delay(10);
}