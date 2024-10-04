# TODO: move docs output to ${CMAKE_SOURCE_DIR}/docs/
include(FetchContent)
function(download_file url hash output_dir)
  FetchContent_Declare(
    download_${hash}
    URL ${url}
    URL_HASH SHA256=${hash}
    SOURCE_DIR ${output_dir}
    DOWNLOAD_NO_EXTRACT true)
  if(NOT download_${hash}_POPULATED)
    FetchContent_Populate(download_${hash})
  endif()
endfunction()

# doxygen
find_package(Doxygen)
if(DOXYGEN_FOUND)
  option(ENABLE_DOXYGEN_AWESOME "Enable doxygen-awesome-css" ON)
  if(ENABLE_DOXYGEN_AWESOME)
    set(DOXYGEN_AWESOME_REPO "jothepro/doxygen-awesome-css")
    set(DOXYGEN_AWESOME_VERSION "2.3.3")
    set(DOXYGEN_AWESOME_HASH
        96555949c7b03e132fd3fc7a9b3193c84ae690492a65de7039608a1015c2f848)
    set(DOXYGEN_AWESOME_BUILD_DIR ${CMAKE_BINARY_DIR})
    download_file(
      https://github.com/${DOXYGEN_AWESOME_REPO}/archive/refs/tags/v${DOXYGEN_AWESOME_VERSION}.zip
      ${DOXYGEN_AWESOME_HASH}
      ${DOXYGEN_AWESOME_BUILD_DIR})
    file(ARCHIVE_EXTRACT INPUT
         ${DOXYGEN_AWESOME_BUILD_DIR}/v${DOXYGEN_AWESOME_VERSION}.zip
         DESTINATION ${DOXYGEN_AWESOME_BUILD_DIR})
    set(DOXYGEN_AWESOME_STYLESHEET
        ${DOXYGEN_AWESOME_BUILD_DIR}/doxygen-awesome-css-${DOXYGEN_AWESOME_VERSION}/doxygen-awesome.css
    )
  endif()

  set(DOXYGEN_IN ${CMAKE_SOURCE_DIR}/Doxyfile.in)
  set(DOXYGEN_OUT ${CMAKE_BINARY_DIR}/Doxyfile)
  set(DOXYGEN_INPUT_DIR ${CMAKE_SOURCE_DIR}/Sources/)
  set(DOXYGEN_BUILD_DIR ${CMAKE_SOURCE_DIR}/docs/)

  list(APPEND DOXYGEN_EXCLUDES "*/vcpkg_installed/*")
  list(JOIN DOXYGEN_EXCLUDES " " DOXYGEN_EXCLUDE_PATTERNS)

  include(ProcessorCount)
  ProcessorCount(NUM_PROCESSORS)
  configure_file(${DOXYGEN_IN} ${DOXYGEN_OUT} @ONLY)

  add_custom_target(
    doxygen
    COMMAND ${DOXYGEN_EXECUTABLE} ${DOXYGEN_OUT}
    WORKING_DIRECTORY ${DOXYGEN_BUILD_DIR}
    COMMENT "Generating API documentation with Doxygen"
    VERBATIM)
endif()
