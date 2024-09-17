find_package(Git REQUIRED)

execute_process(
  COMMAND ${GIT_EXECUTABLE} describe --always --abbrev=8
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE GIT_COMMIT
  OUTPUT_STRIP_TRAILING_WHITESPACE ERROR_QUIET)
execute_process(
  COMMAND ${GIT_EXECUTABLE} status --short
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE GIT_STATUS
  OUTPUT_STRIP_TRAILING_WHITESPACE ERROR_QUIET)
if(("${GIT_COMMIT}" STREQUAL "") OR (NOT "${GIT_STATUS}" STREQUAL ""))
  if(NOT "${GIT_STATUS}" STREQUAL "")
    set(GIT_COMMIT "${GIT_COMMIT}-uncommited")
  else()
    set(GIT_COMMIT "N/A")
  endif()
endif()

execute_process(
  COMMAND ${GIT_EXECUTABLE} describe --exact-match --tags
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE GIT_TAG
  OUTPUT_STRIP_TRAILING_WHITESPACE ERROR_QUIET)
if("${GIT_TAG}" STREQUAL "")
  set(GIT_TAG "N/A")
endif()

execute_process(
  COMMAND ${GIT_EXECUTABLE} rev-parse --abbrev-ref HEAD
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE GIT_BRANCH
  OUTPUT_STRIP_TRAILING_WHITESPACE ERROR_QUIET)
if("${GIT_BRANCH}" STREQUAL "")
  set(GIT_BRANCH "N/A")
endif()

execute_process(
  COMMAND ${GIT_EXECUTABLE} log -n 1 --pretty=%cd --pretty=%cI
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE GIT_DATE
  OUTPUT_STRIP_TRAILING_WHITESPACE ERROR_QUIET)
if("${GIT_DATE}" STREQUAL "")
  set(GIT_DATE "N/A")
endif()

set(PROJECT_BUILD_JSON_FILE "${CMAKE_SOURCE_DIR}/build.json")
if(NOT EXISTS ${PROJECT_BUILD_JSON_FILE})
  message(FATAL_ERROR "cannot find build.json: ${PROJECT_BUILD_JSON_FILE}")
endif()

file(READ ${PROJECT_BUILD_JSON_FILE} PROJECT_BUILD_JSON)
string(JSON BUILD_JSON_NAME GET ${PROJECT_BUILD_JSON} "name")
string(JSON BUILD_JSON_VERSION GET ${PROJECT_BUILD_JSON} "version")
string(JSON BUILD_JSON_HOMEPAGE GET ${PROJECT_BUILD_JSON} "homepage")
