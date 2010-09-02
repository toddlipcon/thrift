#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements. See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership. The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRMVNIES OR CONDITIONS OF ANY
# KIND, either express or implied. See the License for the
# specific language governing permissions and limitations
# under the License.
#

EXTRA_DIST = pom.xml src

export CLASSPATH

all-local:
	$(MVN) $(MVN_FLAGS)

install-exec-hook:
	$(MVN) $(MVN_FLAGS) -DskipTests install

# Make sure this doesn't fail if ant is not configured.
clean-local:
	MVN=$(MVN) ; if test -z "$$MVN" ; then MVN=: ; fi ; \
	$$MVN $(MVN_FLAGS) clean

check-local: all
	$(MVN) $(MVN_FLAGS) test

