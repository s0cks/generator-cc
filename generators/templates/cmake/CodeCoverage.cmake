# gcov
find_program(GCOV_PATH NAMES gcov REQUIRED)
message(STATUS "gcov found: ${GCOV_PATH}")
# lcov
find_program(LCOV_PATH NAMES lcov REQUIRED)
message(STATUS "lcov found: ${LCOV_PATH}")
# genhtml
find_program(GENHTML_PATH NAMES genhtml REQUIRED)
message(STATUS "genhtml found: ${GENHTML_PATH}")

list(APPEND LCOV_IGNORE_ERRORS "inconsistent" "range" "unused")
list(APPEND LCOV_EXCLUDES "${PROJECT_BINARY_DIR}/vcpkg_installed/*" "v1/*"
     "/usr/include/*")

function(create_coverage_target target)
  list(
    APPEND
    ${target}_LCOV_OPTS
    "--directory"
    "${CMAKE_CURRENT_BINARY_DIR}"
    "--output-file"
    "${target}.info"
    "--capture"
    "--rc"
    "branch_coverage=1")
  foreach(excluded ${LCOV_EXCLUDES})
    list(APPEND ${target}_LCOV_OPTS "--exclude" "'${excluded}'")
  endforeach()
  foreach(ignored ${LCOV_IGNORE_ERRORS})
    list(APPEND ${target}_LCOV_OPTS "--ignore-errors" "${ignored}")
  endforeach()

  list(APPEND ${target}_GENHTML_OPTS "-o" "html"
       "${CMAKE_CURRENT_BINARY_DIR}/${target}.info")
  foreach(ignored ${LCOV_IGNORE_ERRORS})
    list(APPEND ${target}_GENHTML_OPTS "--ignore-errors" "${ignored}")
  endforeach()

  add_custom_target(
    ${target}-coverage
    DEPENDS ${target}
    COMMENT "generate coverage using lcov"
    COMMAND ${CMAKE_CURRENT_BINARY_DIR}/${target} --version
    COMMAND ${LCOV_PATH} ${${target}_LCOV_OPTS}
    COMMAND ${GENHTML_PATH} ${${target}_GENHTML_OPTS})
endfunction()
