#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define ESP_ID "ESP_RELAY_ROOM"

#define RELAY_ON HIGH
#define RELAY_OFF LOW

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
bool activePinsState[40];
bool lastSentState[40];

const unsigned long RELAY_TIMEOUT = 4000;
unsigned long lastStatusSend = 0;
const unsigned long STATUS_INTERVAL = 4000;

void connectWiFi() {
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    retry++;

    if (retry > 40) {
      Serial.println("\nWiFi Failed! Restarting...");
      ESP.restart();
    }
  }

  Serial.println("\nWiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  while (!client.connected()) {

    Serial.print("Connecting to MQTT... ");

    if (client.connect(ESP_ID)) {
      Serial.println("Connected");

      client.subscribe("powernest/ESP_RELAY_ROOM/relay/+");
      Serial.println("Subscribed to relay topics");
    }
    else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 sec...");
      delay(2000);
    }
  }
}

void sendActivePins() {

  StaticJsonDocument<256> doc;
  doc["espId"] = ESP_ID;

  JsonArray arr = doc.createNestedArray("activePins");

  Serial.print("Active Pins: [");

  bool first = true;

  for (int i = 0; i < pinCount; i++) {
    int pin = relayPins[i];

    if (activePinsState[pin]) {

      arr.add(pin);

      if (!first) Serial.print(", ");
      Serial.print(pin);

      first = false;
    }
  }

  Serial.println("]");

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish("powernest/status/ESP_RELAY_ROOM", buffer);
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

  bool validPin = false;

  for (int i = 0; i < pinCount; i++) {
    if (relayPins[i] == pin) {
      validPin = true;
      break;
    }
  }

  if (!validPin) {
    Serial.println("Invalid Pin Received");
    return;
  }

  if (msg == "ON") {
    digitalWrite(pin, RELAY_ON);
    manualHold[pin] = false;
    lastActiveTime[pin] = millis();
    activePinsState[pin] = true;
  }

  else if (msg == "ON_MANUAL") {
    digitalWrite(pin, RELAY_ON);
    manualHold[pin] = true;
    activePinsState[pin] = true;
  }

  else if (msg == "OFF") {
    digitalWrite(pin, RELAY_OFF);
    manualHold[pin] = false;
    activePinsState[pin] = false;
  }

  else if (msg == "MANUAL_OFF") {
    digitalWrite(pin, RELAY_OFF);
    manualHold[pin] = false;
    activePinsState[pin] = false;
  }
}


void setup() {

  Serial.begin(115200);
  delay(1000);

  Serial.println("\nStarting ESP Relay Controller...");

  for (int i = 0; i < pinCount; i++) {

    int pin = relayPins[i];

    pinMode(pin, OUTPUT);
    digitalWrite(pin, RELAY_OFF);

    lastActiveTime[pin] = 0;
    manualHold[pin] = false;
    activePinsState[pin] = false;
    lastSentState[pin] = false;
  }

  connectWiFi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  connectMQTT();

  Serial.println("SYSTEM READY: " ESP_ID);
}


void loop() {

  if (!client.connected()) connectMQTT();

  client.loop();

  unsigned long now = millis();

  for (int i = 0; i < pinCount; i++) {

    int pin = relayPins[i];

    if (!manualHold[pin] &&
        digitalRead(pin) == RELAY_ON &&
        now - lastActiveTime[pin] > RELAY_TIMEOUT) {

      digitalWrite(pin, RELAY_OFF);
      activePinsState[pin] = false;
    }
  }

  if (hasChanged()) {
    sendActivePins();
    copyCurrentToLast();
    lastStatusSend = now;
  }

  if (now - lastStatusSend > STATUS_INTERVAL) {
    sendActivePins();
    copyCurrentToLast();
    lastStatusSend = now;
  }

  delay(10);
}